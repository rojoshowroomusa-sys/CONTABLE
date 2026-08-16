'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { PlanCuenta } from '@/types/contabilidad'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react'

interface PlanCuentasTreeProps {
  cuentas: PlanCuenta[]
  onSelect?: (cuenta: PlanCuenta) => void
  onCreate?: (data: any) => Promise<void>
  onUpdate?: (id: string, data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  empresaId: string
}

export function PlanCuentasTree({
  cuentas,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  empresaId,
}: PlanCuentasTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState<PlanCuenta | null>(null)
  const [selectedCuentaId, setSelectedCuentaId] = useState<string | null>(null)

  // Form state
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<string>('activo')
  const [padreId, setPadreId] = useState<string | null>(null)

  const tree = useMemo(() => {
    const map = new Map<string, PlanCuenta & { children: PlanCuenta[] }>()
    const roots: (PlanCuenta & { children: PlanCuenta[] })[] = []

    for (const cuenta of cuentas) {
      map.set(cuenta.id, { ...cuenta, children: [] })
    }

    for (const cuenta of cuentas) {
      const node = map.get(cuenta.id)!
      if (cuenta.padre_id && map.has(cuenta.padre_id)) {
        map.get(cuenta.padre_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }, [cuentas])

  const filteredCuentas = useMemo(() => {
    if (!search) return cuentas
    return cuentas.filter(
      (c) =>
        c.codigo_cuenta.toLowerCase().includes(search.toLowerCase()) ||
        c.nombre.toLowerCase().includes(search.toLowerCase())
    )
  }, [cuentas, search])

  const toggleExpanded = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreateDialog = (parentId?: string | null) => {
    setEditingCuenta(null)
    setCodigo('')
    setNombre('')
    setTipo('activo')
    setPadreId(parentId || null)
    setDialogOpen(true)
  }

  const openEditDialog = (cuenta: PlanCuenta) => {
    setEditingCuenta(cuenta)
    setCodigo(cuenta.codigo_cuenta)
    setNombre(cuenta.nombre)
    setTipo(cuenta.tipo)
    setPadreId(cuenta.padre_id)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (editingCuenta && onUpdate) {
      await onUpdate(editingCuenta.id, {
        codigo_cuenta: codigo,
        nombre,
        tipo,
        padre_id: padreId,
      })
    } else if (onCreate) {
      await onCreate({
        empresa_id: empresaId,
        codigo_cuenta: codigo,
        nombre,
        tipo,
        nivel: padreId ? 2 : 1,
        padre_id: padreId,
      })
    }
    setDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (onDelete && confirm('¿Eliminar esta cuenta?')) {
      await onDelete(id)
    }
  }

  const renderNode = (node: PlanCuenta & { children: PlanCuenta[] }, level = 0) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedCuentaId === node.id

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent',
            isSelected && 'bg-accent font-medium'
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            setSelectedCuentaId(node.id)
            onSelect?.(node)
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.id)
              }}
              className="h-4 w-4 shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="h-4 w-4 shrink-0" />
          )}
          <span className="font-mono text-xs text-muted-foreground w-16">
            {node.codigo_cuenta}
          </span>
          <span className="flex-1">{node.nombre}</span>
          <span className="text-xs text-muted-foreground capitalize">{node.tipo}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                openCreateDialog(node.id)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                openEditDialog(node)
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(node.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children
              .sort((a, b) => a.codigo_cuenta.localeCompare(b.codigo_cuenta))
              .map((child) => renderNode(child as PlanCuenta & { children: PlanCuenta[] }, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar cuenta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={() => openCreateDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cuenta
        </Button>
      </div>

      <div className="rounded-md border p-2">
        {search ? (
          filteredCuentas.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No se encontraron cuentas
            </p>
          ) : (
            filteredCuentas.map((cuenta) => (
              <div
                key={cuenta.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                onClick={() => {
                  setSelectedCuentaId(cuenta.id)
                  onSelect?.(cuenta)
                }}
              >
                <span className="font-mono text-xs text-muted-foreground w-16">
                  {cuenta.codigo_cuenta}
                </span>
                <span className="flex-1">{cuenta.nombre}</span>
                <span className="text-xs text-muted-foreground capitalize">{cuenta.tipo}</span>
              </div>
            ))
          )
        ) : tree.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay cuentas en el plan. Creá la primera cuenta.
          </p>
        ) : (
          tree
            .sort((a, b) => a.codigo_cuenta.localeCompare(b.codigo_cuenta))
            .map((node) => (
              <div key={node.id} className="group">
                {renderNode(node)}
              </div>
            ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
            </DialogTitle>
            <DialogDescription>
              {editingCuenta
                ? 'Modificá los datos de la cuenta'
                : 'Completá los datos para crear una nueva cuenta'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: 1.1.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la cuenta"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="pasivo">Pasivo</SelectItem>
                  <SelectItem value="patrimonio">Patrimonio</SelectItem>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingCuenta ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Plus, Lock, Unlock, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface PeriodoContable {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  created_at: string
}

export default function PeriodosPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const supabase = createClient()

  const fetchPeriodos = async () => {
    const { data } = await supabase
      .from('periodos_contables')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha_inicio', { ascending: false })

    setPeriodos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPeriodos()
  }, [empresaId])

  const handleCreate = async () => {
    if (!nombre || !fechaInicio || !fechaFin) {
      toast.error('Todos los campos son requeridos')
      return
    }

    const { error } = await supabase.from('periodos_contables').insert({
      empresa_id: empresaId,
      nombre,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Período creado correctamente')
      setDialogOpen(false)
      setNombre('')
      setFechaInicio('')
      setFechaFin('')
      fetchPeriodos()
    }
  }

  const handleCerrar = async (periodoId: string) => {
    if (!confirm('¿Cerrar este período? No se podrán crear asientos en este rango de fechas.')) return

    const { error } = await supabase
      .from('periodos_contables')
      .update({ estado: 'cerrado' })
      .eq('id', periodoId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Período cerrado correctamente')
      fetchPeriodos()
    }
  }

  const handleAbrir = async (periodoId: string) => {
    const { error } = await supabase
      .from('periodos_contables')
      .update({ estado: 'abierto' })
      .eq('id', periodoId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Período reabierto')
      fetchPeriodos()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Períodos Contables</h1>
          <p className="text-muted-foreground">Gestión de períodos de apertura y cierre</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Período
        </Button>
      </div>

      {periodos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay períodos creados</p>
            <p className="text-sm text-muted-foreground mb-4">
              Creá un período para comenzar a registrar asientos
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Período
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {periodos.map((periodo) => (
            <Card key={periodo.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{periodo.nombre}</CardTitle>
                  <CardDescription>
                    {formatDate(periodo.fecha_inicio)} - {formatDate(periodo.fecha_fin)}
                  </CardDescription>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    periodo.estado === 'abierto'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {periodo.estado === 'abierto' ? (
                    <Unlock className="mr-1 h-3 w-3" />
                  ) : (
                    <Lock className="mr-1 h-3 w-3" />
                  )}
                  {periodo.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {periodo.estado === 'abierto' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCerrar(periodo.id)}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Cerrar Período
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAbrir(periodo.id)}
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Reabrir Período
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Período Contable</DialogTitle>
            <DialogDescription>
              Creá un nuevo período para registrar asientos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Enero 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear Período</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useCuentasCorrientes } from '@/lib/hooks/use-cuentas-corrientes'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { EstadoLetra } from '@/types/cuentas-corrientes'

const estadoBadgeColor: Record<EstadoLetra, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aceptada: 'bg-blue-100 text-blue-800',
  vencida: 'bg-red-100 text-red-800',
  pagada: 'bg-green-100 text-green-800',
  protestada: 'bg-orange-100 text-orange-800',
}

export default function LetrasPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { terceros, letras, loading, fetchLetras, fetchTerceros, createLetra, updateEstadoLetra } = useCuentasCorrientes(empresaId)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string>('todos')
  const [formData, setFormData] = useState({
    tercero_id: '',
    numero: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    monto: '',
    tercero_tipo: 'cliente' as 'cliente' | 'proveedor',
  })

  useEffect(() => {
    fetchTerceros()
    fetchLetras()
  }, [fetchTerceros, fetchLetras])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createLetra({
      empresa_id: empresaId,
      tercero_id: formData.tercero_id,
      numero: formData.numero,
      fecha_emision: formData.fecha_emision,
      fecha_vencimiento: formData.fecha_vencimiento,
      monto: parseFloat(formData.monto),
      tercero_tipo: formData.tercero_tipo,
    })
    setFormData({ tercero_id: '', numero: '', fecha_emision: new Date().toISOString().split('T')[0], fecha_vencimiento: '', monto: '', tercero_tipo: 'cliente' })
    setShowForm(false)
  }

  const letrasFiltradas = filter === 'todos' ? letras : letras.filter((l) => l.estado === filter)
  const totalPendientes = letras.filter((l) => l.estado !== 'pagada').reduce((sum, l) => sum + Number(l.monto), 0)

  if (loading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Letras</h1>
          <p className="text-muted-foreground">Gestión de letras de cambio — Total pendiente: <strong>{formatCurrency(totalPendientes)}</strong></p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nueva Letra'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Letra</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.tercero_tipo} onValueChange={(v) => setFormData((p) => ({ ...p, tercero_tipo: v as any, tercero_id: '' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="proveedor">Proveedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tercero</Label>
                  <Select value={formData.tercero_id} onValueChange={(v) => setFormData((p) => ({ ...p, tercero_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {terceros.filter((t) => t.tipo === formData.tercero_tipo).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.razon_social}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número</Label>
                  <Input value={formData.numero} onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))} required />
                </div>
                <div>
                  <Label>Fecha Emisión</Label>
                  <Input type="date" value={formData.fecha_emision} onChange={(e) => setFormData((p) => ({ ...p, fecha_emision: e.target.value }))} required />
                </div>
                <div>
                  <Label>Fecha Vencimiento</Label>
                  <Input type="date" value={formData.fecha_vencimiento} onChange={(e) => setFormData((p) => ({ ...p, fecha_vencimiento: e.target.value }))} required />
                </div>
                <div>
                  <Label>Monto</Label>
                  <Input type="number" step="0.01" value={formData.monto} onChange={(e) => setFormData((p) => ({ ...p, monto: e.target.value }))} required />
                </div>
              </div>
              <Button type="submit">Guardar Letra</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {['todos', 'pendiente', 'aceptada', 'vencida', 'pagada', 'protestada'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-[100px_1fr_100px_100px_120px_120px_100px] gap-2 bg-muted p-2 text-xs font-medium">
              <span>Número</span><span>Tercero</span><span>Emisión</span><span>Vto.</span><span>Monto</span><span>Estado</span><span>Acciones</span>
            </div>
            {letrasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin letras registradas</div>
            ) : (
              letrasFiltradas.map((l) => (
                <div key={l.id} className="grid grid-cols-[100px_1fr_100px_100px_120px_120px_100px] gap-2 border-t p-2 text-sm">
                  <span className="font-mono">{l.numero}</span>
                  <span className="truncate">{(l.tercero as any)?.razon_social || '-'}</span>
                  <span>{formatDate(l.fecha_emision)}</span>
                  <span>{formatDate(l.fecha_vencimiento)}</span>
                  <span className="text-right font-medium">{formatCurrency(l.monto)}</span>
                  <Badge variant="secondary" className={estadoBadgeColor[l.estado]}>{l.estado}</Badge>
                  <div className="flex gap-1">
                    {l.estado === 'pendiente' && (
                      <Button variant="ghost" size="sm" onClick={() => updateEstadoLetra(l.id, 'aceptada')}>Acreditar</Button>
                    )}
                    {l.estado === 'aceptada' && (
                      <Button variant="ghost" size="sm" onClick={() => updateEstadoLetra(l.id, 'pagada')}>Pagar</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

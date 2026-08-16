'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useModulosAvanzados } from '@/lib/hooks/use-modulos-avanzados'
import { formatDate } from '@/lib/utils'
import type { EstadoConvenio } from '@/types/modulos-avanzados'

const estadoColor: Record<EstadoConvenio, string> = {
  vigente: 'bg-green-100 text-green-800',
  vencido: 'bg-red-100 text-red-800',
  suspendido: 'bg-yellow-100 text-yellow-800',
}

export default function ConveniosPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { convenios, loading, createConvenio } = useModulosAvanzados(empresaId)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    numero: '',
    descripcion: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    porcentaje_retencion: '',
    jurisdiccion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createConvenio({
      empresa_id: empresaId,
      numero: formData.numero,
      descripcion: formData.descripcion,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      porcentaje_retencion: parseFloat(formData.porcentaje_retencion),
      jurisdiccion: formData.jurisdiccion || undefined,
    })
    setFormData({ numero: '', descripcion: '', fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: '', porcentaje_retencion: '', jurisdiccion: '' })
    setShowForm(false)
  }

  if (loading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Convenios Multilaterales</h1>
          <p className="text-muted-foreground">Gestión de convenios de retención multilateral</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo Convenio'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Convenio</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Número</Label><Input value={formData.numero} onChange={(e) => setFormData((p) => ({ ...p, numero: e.target.value }))} required /></div>
                <div className="col-span-2"><Label>Descripción</Label><Input value={formData.descripcion} onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))} required /></div>
                <div><Label>Fecha Inicio</Label><Input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData((p) => ({ ...p, fecha_inicio: e.target.value }))} required /></div>
                <div><Label>Fecha Fin</Label><Input type="date" value={formData.fecha_fin} onChange={(e) => setFormData((p) => ({ ...p, fecha_fin: e.target.value }))} required /></div>
                <div><Label>% Retención</Label><Input type="number" step="0.01" value={formData.porcentaje_retencion} onChange={(e) => setFormData((p) => ({ ...p, porcentaje_retencion: e.target.value }))} required /></div>
                <div><Label>Jurisdicción</Label><Input value={formData.jurisdiccion} onChange={(e) => setFormData((p) => ({ ...p, jurisdiccion: e.target.value }))} /></div>
              </div>
              <Button type="submit">Guardar Convenio</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-[100px_1fr_100px_100px_100px_120px_80px] gap-2 bg-muted p-2 text-xs font-medium">
              <span>Número</span><span>Descripción</span><span>Inicio</span><span>Fin</span><span>% Ret.</span><span>Jurisdicción</span><span>Estado</span>
            </div>
            {convenios.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin convenios registrados</div>
            ) : (
              convenios.map((c) => (
                <div key={c.id} className="grid grid-cols-[100px_1fr_100px_100px_100px_120px_80px] gap-2 border-t p-2 text-sm">
                  <span className="font-mono">{c.numero}</span>
                  <span className="truncate">{c.descripcion}</span>
                  <span>{formatDate(c.fecha_inicio)}</span>
                  <span>{formatDate(c.fecha_fin)}</span>
                  <span className="text-right">{c.porcentaje_retencion}%</span>
                  <span className="truncate text-muted-foreground">{c.jurisdiccion || '-'}</span>
                  <Badge variant="secondary" className={estadoColor[c.estado]}>{c.estado}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

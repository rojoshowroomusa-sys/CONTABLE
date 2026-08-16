'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useModulosAvanzados } from '@/lib/hooks/use-modulos-avanzados'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RRHHPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { empleados, loading, createEmpleado, deleteEmpleado } = useModulosAvanzados(empresaId)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    legajo: '',
    nombre: '',
    cuil: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    puesto: '',
    sector: '',
    salario_base: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createEmpleado({
      empresa_id: empresaId,
      legajo: formData.legajo,
      nombre: formData.nombre,
      cuil: formData.cuil,
      fecha_ingreso: formData.fecha_ingreso,
      puesto: formData.puesto || undefined,
      sector: formData.sector || undefined,
      salario_base: parseFloat(formData.salario_base) || 0,
    })
    setFormData({ legajo: '', nombre: '', cuil: '', fecha_ingreso: new Date().toISOString().split('T')[0], puesto: '', sector: '', salario_base: '' })
    setShowForm(false)
  }

  const totalNomina = empleados.reduce((sum, e) => sum + Number(e.salario_base), 0)

  if (loading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos Humanos</h1>
          <p className="text-muted-foreground">Gestión de empleados y nómina — Total nómina: <strong>{formatCurrency(totalNomina)}</strong></p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo Empleado'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Empleado</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Legajo</Label><Input value={formData.legajo} onChange={(e) => setFormData((p) => ({ ...p, legajo: e.target.value }))} required /></div>
                <div><Label>Nombre Completo</Label><Input value={formData.nombre} onChange={(e) => setFormData((p) => ({ ...p, nombre: e.target.value }))} required /></div>
                <div><Label>CUIL</Label><Input value={formData.cuil} onChange={(e) => setFormData((p) => ({ ...p, cuil: e.target.value }))} required /></div>
                <div><Label>Fecha Ingreso</Label><Input type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData((p) => ({ ...p, fecha_ingreso: e.target.value }))} required /></div>
                <div><Label>Puesto</Label><Input value={formData.puesto} onChange={(e) => setFormData((p) => ({ ...p, puesto: e.target.value }))} /></div>
                <div><Label>Sector</Label><Input value={formData.sector} onChange={(e) => setFormData((p) => ({ ...p, sector: e.target.value }))} /></div>
                <div><Label>Salario Base</Label><Input type="number" step="0.01" value={formData.salario_base} onChange={(e) => setFormData((p) => ({ ...p, salario_base: e.target.value }))} /></div>
              </div>
              <Button type="submit">Guardar Empleado</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Empleados Activos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{empleados.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Nómina Total Mensual</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalNomina)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Promedio Salarial</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{empleados.length > 0 ? formatCurrency(totalNomina / empleados.length) : '$0'}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-[80px_1fr_120px_100px_120px_120px_80px] gap-2 bg-muted p-2 text-xs font-medium">
              <span>Legajo</span><span>Nombre</span><span>CUIL</span><span>Puesto</span><span>Sector</span><span>Salario</span><span>Acciones</span>
            </div>
            {empleados.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin empleados registrados</div>
            ) : (
              empleados.map((e) => (
                <div key={e.id} className="grid grid-cols-[80px_1fr_120px_100px_120px_120px_80px] gap-2 border-t p-2 text-sm">
                  <span className="font-mono">{e.legajo}</span>
                  <span className="truncate font-medium">{e.nombre}</span>
                  <span>{e.cuil}</span>
                  <span className="truncate">{e.puesto || '-'}</span>
                  <span className="truncate text-muted-foreground">{e.sector || '-'}</span>
                  <span className="text-right font-medium">{formatCurrency(e.salario_base)}</span>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteEmpleado(e.id)}>
                    Baja
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

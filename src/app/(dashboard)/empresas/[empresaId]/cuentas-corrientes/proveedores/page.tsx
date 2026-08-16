'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCuentasCorrientes } from '@/lib/hooks/use-cuentas-corrientes'
import { AgingTable } from '@/components/cuentas-corrientes/aging-table'
import type { AgingItem } from '@/types/cuentas-corrientes'
import { formatCurrency } from '@/lib/utils'

export default function ProveedoresPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { terceros, loading, fetchTerceros, createTercero, deleteTercero, fetchAging } = useCuentasCorrientes(empresaId)
  const [showForm, setShowForm] = useState(false)
  const [aging, setAging] = useState<AgingItem[]>([])
  const [formData, setFormData] = useState({
    razon_social: '',
    identificacion_fiscal: '',
    domicilio: '',
    telefono: '',
    email: '',
  })

  useEffect(() => {
    fetchTerceros('proveedor')
  }, [fetchTerceros])

  useEffect(() => {
    fetchAging('proveedor').then(setAging)
  }, [fetchAging, terceros])

  const proveedores = terceros.filter((t) => t.tipo === 'proveedor')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTercero({
      empresa_id: empresaId,
      tipo: 'proveedor',
      ...formData,
      email: formData.email || undefined,
      domicilio: formData.domicilio || undefined,
      telefono: formData.telefono || undefined,
    })
    setFormData({ razon_social: '', identificacion_fiscal: '', domicilio: '', telefono: '', email: '' })
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  const totalSaldos = proveedores.reduce((sum, p) => sum + Number(p.saldo), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestión de proveedores y saldos de cuenta corriente</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo Proveedor'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Razón Social</Label>
                  <Input value={formData.razon_social} onChange={(e) => setFormData((p) => ({ ...p, razon_social: e.target.value }))} required />
                </div>
                <div>
                  <Label>CUIT/DNI</Label>
                  <Input value={formData.identificacion_fiscal} onChange={(e) => setFormData((p) => ({ ...p, identificacion_fiscal: e.target.value }))} required />
                </div>
                <div>
                  <Label>Domicilio</Label>
                  <Input value={formData.domicilio} onChange={(e) => setFormData((p) => ({ ...p, domicilio: e.target.value }))} />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={formData.telefono} onChange={(e) => setFormData((p) => ({ ...p, telefono: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <Button type="submit">Guardar Proveedor</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listado de Proveedores</span>
            <span className="text-sm font-normal text-muted-foreground">
              Total saldos: <span className="font-bold text-foreground">{formatCurrency(totalSaldos)}</span> ({proveedores.length} proveedores)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[1fr_120px_100px_150px_80px] gap-2 bg-muted p-2 text-xs font-medium">
              <span>Razón Social</span>
              <span>CUIT/DNI</span>
              <span className="text-right">Saldo</span>
              <span>Teléfono</span>
              <span>Acciones</span>
            </div>
            {proveedores.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin proveedores registrados</div>
            ) : (
              proveedores.map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_120px_100px_150px_80px] gap-2 border-t p-2 text-sm">
                  <span className="truncate font-medium">{p.razon_social}</span>
                  <span>{p.identificacion_fiscal}</span>
                  <span className={`text-right ${Number(p.saldo) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(p.saldo)}</span>
                  <span className="truncate text-muted-foreground">{p.telefono || '-'}</span>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteTercero(p.id)}>
                    Eliminar
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <AgingTable items={aging} title="Antigüedad de Saldos - Proveedores" />
    </div>
  )
}

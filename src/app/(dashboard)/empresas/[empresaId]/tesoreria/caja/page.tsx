'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useTesoreria } from '@/lib/hooks/use-tesoreria'
import { MovimientosCajaTable } from '@/components/tesoreria/movimientos-caja-table'
import type { MovimientoCaja } from '@/types/tesoreria'
import { formatCurrency } from '@/lib/utils'

export default function CajaPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { cajas, loading, createCaja, addMovimientoCaja, fetchMovimientosCaja } = useTesoreria(empresaId)
  const [selectedCaja, setSelectedCaja] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [showCajaForm, setShowCajaForm] = useState(false)
  const [showMovForm, setShowMovForm] = useState(false)
  const [cajaForm, setCajaForm] = useState({ nombre: '', moneda: 'ARS', saldo_inicial: '' })
  const [movForm, setMovForm] = useState({ fecha: new Date().toISOString().split('T')[0], tipo: 'ingreso', descripcion: '', monto: '' })

  const loadMovimientos = async (cajaId: string) => {
    const data = await fetchMovimientosCaja(cajaId)
    setMovimientos(data)
  }

  useEffect(() => {
    if (selectedCaja) loadMovimientos(selectedCaja)
  }, [selectedCaja])

  const handleCreateCaja = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createCaja({
      empresa_id: empresaId,
      nombre: cajaForm.nombre,
      moneda: cajaForm.moneda,
      saldo_inicial: parseFloat(cajaForm.saldo_inicial) || 0,
    })
    if (result) {
      setCajaForm({ nombre: '', moneda: 'ARS', saldo_inicial: '' })
      setShowCajaForm(false)
    }
  }

  const handleAddMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCaja) return
    await addMovimientoCaja({
      caja_id: selectedCaja,
      fecha: movForm.fecha,
      tipo: movForm.tipo,
      descripcion: movForm.descripcion,
      monto: parseFloat(movForm.monto),
    })
    setMovForm({ fecha: new Date().toISOString().split('T')[0], tipo: 'ingreso', descripcion: '', monto: '' })
    setShowMovForm(false)
    loadMovimientos(selectedCaja)
  }

  if (loading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
          <p className="text-muted-foreground">Gestión de cajas y movimientos de efectivo</p>
        </div>
        <div className="flex gap-2">
          {selectedCaja && <Button onClick={() => setShowMovForm(!showMovForm)}>{showMovForm ? 'Cancelar' : '+ Movimiento'}</Button>}
          <Button onClick={() => setShowCajaForm(!showCajaForm)}>{showCajaForm ? 'Cancelar' : '+ Nueva Caja'}</Button>
        </div>
      </div>

      {showCajaForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Caja</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCaja} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Nombre</Label><Input value={cajaForm.nombre} onChange={(e) => setCajaForm((p) => ({ ...p, nombre: e.target.value }))} required /></div>
                <div><Label>Moneda</Label><Select value={cajaForm.moneda} onValueChange={(v) => setCajaForm((p) => ({ ...p, moneda: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ARS">ARS</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                </Select></div>
                <div><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={cajaForm.saldo_inicial} onChange={(e) => setCajaForm((p) => ({ ...p, saldo_inicial: e.target.value }))} /></div>
              </div>
              <Button type="submit">Crear Caja</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showMovForm && selectedCaja && (
        <Card>
          <CardHeader><CardTitle>Nuevo Movimiento</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddMovimiento} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Fecha</Label><Input type="date" value={movForm.fecha} onChange={(e) => setMovForm((p) => ({ ...p, fecha: e.target.value }))} required /></div>
                <div><Label>Tipo</Label><Select value={movForm.tipo} onValueChange={(v) => setMovForm((p) => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ingreso">Ingreso</SelectItem><SelectItem value="egreso">Egreso</SelectItem></SelectContent>
                </Select></div>
                <div><Label>Descripción</Label><Input value={movForm.descripcion} onChange={(e) => setMovForm((p) => ({ ...p, descripcion: e.target.value }))} required /></div>
                <div><Label>Monto</Label><Input type="number" step="0.01" value={movForm.monto} onChange={(e) => setMovForm((p) => ({ ...p, monto: e.target.value }))} required /></div>
              </div>
              <Button type="submit">Guardar Movimiento</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cajas.map((caja) => (
          <Card key={caja.id} className={`cursor-pointer transition-colors ${selectedCaja === caja.id ? 'border-primary' : 'hover:border-muted-foreground/50'}`} onClick={() => setSelectedCaja(caja.id)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{caja.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(caja.saldo_actual)}</div>
              <p className="text-xs text-muted-foreground">{caja.moneda}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCaja && <MovimientosCajaTable movimientos={movimientos} />}
    </div>
  )
}

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
import type { MovimientoBanco } from '@/types/tesoreria'
import { formatCurrency } from '@/lib/utils'

export default function BancosPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { cuentasBancarias, loading, createCuentaBancaria, addMovimientoBanco, fetchMovimientosBanco } = useTesoreria(empresaId)
  const [selectedCuenta, setSelectedCuenta] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [showCuentaForm, setShowCuentaForm] = useState(false)
  const [showMovForm, setShowMovForm] = useState(false)
  const [cuentaForm, setCuentaForm] = useState({ banco: '', numero_cuenta: '', tipo_cuenta: 'cuenta_corriente', moneda: 'ARS', saldo_inicial: '', titular: '', cbu: '' })
  const [movForm, setMovForm] = useState({ fecha: new Date().toISOString().split('T')[0], tipo: 'deposito' as string, descripcion: '', monto: '' })

  const loadMovimientos = async (cuentaId: string) => {
    const data = await fetchMovimientosBanco(cuentaId)
    setMovimientos(data)
  }

  useEffect(() => {
    if (selectedCuenta) loadMovimientos(selectedCuenta)
  }, [selectedCuenta])

  const handleCreateCuenta = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createCuentaBancaria({
      empresa_id: empresaId,
      banco: cuentaForm.banco,
      numero_cuenta: cuentaForm.numero_cuenta,
      tipo_cuenta: cuentaForm.tipo_cuenta,
      moneda: cuentaForm.moneda,
      saldo_inicial: parseFloat(cuentaForm.saldo_inicial) || 0,
      titular: cuentaForm.titular || undefined,
      cbu: cuentaForm.cbu || undefined,
    })
    if (result) {
      setCuentaForm({ banco: '', numero_cuenta: '', tipo_cuenta: 'cuenta_corriente', moneda: 'ARS', saldo_inicial: '', titular: '', cbu: '' })
      setShowCuentaForm(false)
    }
  }

  const handleAddMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCuenta) return
    await addMovimientoBanco({
      cuenta_bancaria_id: selectedCuenta,
      fecha: movForm.fecha,
      tipo: movForm.tipo as any,
      descripcion: movForm.descripcion,
      monto: parseFloat(movForm.monto),
    })
    setMovForm({ fecha: new Date().toISOString().split('T')[0], tipo: 'deposito', descripcion: '', monto: '' })
    setShowMovForm(false)
    loadMovimientos(selectedCuenta)
  }

  if (loading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bancos</h1>
          <p className="text-muted-foreground">Gestión de cuentas bancarias y movimientos</p>
        </div>
        <div className="flex gap-2">
          {selectedCuenta && <Button onClick={() => setShowMovForm(!showMovForm)}>{showMovForm ? 'Cancelar' : '+ Movimiento'}</Button>}
          <Button onClick={() => setShowCuentaForm(!showCuentaForm)}>{showCuentaForm ? 'Cancelar' : '+ Nueva Cuenta'}</Button>
        </div>
      </div>

      {showCuentaForm && (
        <Card>
          <CardHeader><CardTitle>Nueva Cuenta Bancaria</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCuenta} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Banco</Label><Input value={cuentaForm.banco} onChange={(e) => setCuentaForm((p) => ({ ...p, banco: e.target.value }))} required /></div>
                <div><Label>Número Cuenta</Label><Input value={cuentaForm.numero_cuenta} onChange={(e) => setCuentaForm((p) => ({ ...p, numero_cuenta: e.target.value }))} required /></div>
                <div><Label>Tipo</Label><Select value={cuentaForm.tipo_cuenta} onValueChange={(v) => setCuentaForm((p) => ({ ...p, tipo_cuenta: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cuenta_corriente">Cta. Corriente</SelectItem><SelectItem value="caja_ahorro">Caja de Ahorro</SelectItem></SelectContent>
                </Select></div>
                <div><Label>Titular</Label><Input value={cuentaForm.titular} onChange={(e) => setCuentaForm((p) => ({ ...p, titular: e.target.value }))} /></div>
                <div><Label>CBU</Label><Input value={cuentaForm.cbu} onChange={(e) => setCuentaForm((p) => ({ ...p, cbu: e.target.value }))} /></div>
                <div><Label>Saldo Inicial</Label><Input type="number" step="0.01" value={cuentaForm.saldo_inicial} onChange={(e) => setCuentaForm((p) => ({ ...p, saldo_inicial: e.target.value }))} /></div>
              </div>
              <Button type="submit">Crear Cuenta</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showMovForm && selectedCuenta && (
        <Card>
          <CardHeader><CardTitle>Nuevo Movimiento Bancario</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddMovimiento} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Fecha</Label><Input type="date" value={movForm.fecha} onChange={(e) => setMovForm((p) => ({ ...p, fecha: e.target.value }))} required /></div>
                <div><Label>Tipo</Label><Select value={movForm.tipo} onValueChange={(v) => setMovForm((p) => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="retiro">Retiro</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="intereses">Intereses</SelectItem>
                    <SelectItem value="comision">Comisión</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
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
        {cuentasBancarias.map((cuenta) => (
          <Card key={cuenta.id} className={`cursor-pointer transition-colors ${selectedCuenta === cuenta.id ? 'border-primary' : 'hover:border-muted-foreground/50'}`} onClick={() => setSelectedCuenta(cuenta.id)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{cuenta.banco}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(cuenta.saldo_actual)}</div>
              <p className="text-xs text-muted-foreground">{cuenta.numero_cuenta} • {cuenta.tipo_cuenta.replace('_', ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCuenta && <MovimientosCajaTable movimientos={movimientos} />}
    </div>
  )
}

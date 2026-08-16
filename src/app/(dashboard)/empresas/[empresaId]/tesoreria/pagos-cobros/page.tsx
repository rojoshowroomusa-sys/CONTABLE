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
import { useTesoreria } from '@/lib/hooks/use-tesoreria'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Letra, Cheque } from '@/types/cuentas-corrientes'

export default function PagosCobrosPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { terceros, letras, cheques, loading, fetchTerceros, fetchLetras, fetchCheques } = useCuentasCorrientes(empresaId)
  const { cajas, cuentasBancarias, addMovimientoCaja, addMovimientoBanco } = useTesoreria(empresaId)
  const [tipo, setTipo] = useState<'pago' | 'cobro'>('cobro')
  const [formData, setFormData] = useState({
    tercero_id: '',
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    forma_pago: 'efectivo',
    destino: '',
    notas: '',
  })

  useEffect(() => {
    fetchTerceros()
    fetchLetras()
    fetchCheques()
  }, [fetchTerceros, fetchLetras, fetchCheques])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const monto = parseFloat(formData.monto)
    const tercero = terceros.find((t) => t.id === formData.tercero_id)
    if (!tercero) return

    if (tipo === 'cobro' && formData.forma_pago === 'efectivo' && formData.destino) {
      await addMovimientoCaja({
        caja_id: formData.destino,
        fecha: formData.fecha,
        tipo: 'ingreso',
        descripcion: `Cobro a ${tercero.razon_social}`,
        monto,
      })
    } else if (tipo === 'cobro' && formData.forma_pago === 'transferencia' && formData.destino) {
      await addMovimientoBanco({
        cuenta_bancaria_id: formData.destino,
        fecha: formData.fecha,
        tipo: 'deposito',
        descripcion: `Cobro a ${tercero.razon_social}`,
        monto,
      })
    } else if (tipo === 'pago' && formData.forma_pago === 'efectivo' && formData.destino) {
      await addMovimientoCaja({
        caja_id: formData.destino,
        fecha: formData.fecha,
        tipo: 'egreso',
        descripcion: `Pago a ${tercero.razon_social}`,
        monto,
      })
    } else if (tipo === 'pago' && formData.forma_pago === 'transferencia' && formData.destino) {
      await addMovimientoBanco({
        cuenta_bancaria_id: formData.destino,
        fecha: formData.fecha,
        tipo: 'retiro',
        descripcion: `Pago a ${tercero.razon_social}`,
        monto,
      })
    }

    setFormData({ tercero_id: '', fecha: new Date().toISOString().split('T')[0], monto: '', forma_pago: 'efectivo', destino: '', notas: '' })
  }

  const clientes = terceros.filter((t) => t.tipo === 'cliente')
  const proveedores = terceros.filter((t) => t.tipo === 'proveedor')
  const totalCobrar = clientes.reduce((sum, c) => sum + Number(c.saldo), 0)
  const totalPagar = proveedores.reduce((sum, p) => sum + Number(p.saldo), 0)

  if (loading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagos y Cobros</h1>
        <p className="text-muted-foreground">Registrar pagos a proveedores y cobros de clientes</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total a Cobrar (Clientes)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalCobrar)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total a Pagar (Proveedores)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(totalPagar)}</div></CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button variant={tipo === 'cobro' ? 'default' : 'outline'} onClick={() => setTipo('cobro')}>Cobro a Cliente</Button>
        <Button variant={tipo === 'pago' ? 'default' : 'outline'} onClick={() => setTipo('pago')}>Pago a Proveedor</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tipo === 'cobro' ? 'Registrar Cobro' : 'Registrar Pago'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{tipo === 'cobro' ? 'Cliente' : 'Proveedor'}</Label>
                <Select value={formData.tercero_id} onValueChange={(v) => setFormData((p) => ({ ...p, tercero_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {(tipo === 'cobro' ? clientes : proveedores).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.razon_social} ({formatCurrency(t.saldo)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={formData.fecha} onChange={(e) => setFormData((p) => ({ ...p, fecha: e.target.value }))} required />
              </div>
              <div>
                <Label>Monto</Label>
                <Input type="number" step="0.01" value={formData.monto} onChange={(e) => setFormData((p) => ({ ...p, monto: e.target.value }))} required />
              </div>
              <div>
                <Label>Forma de Pago</Label>
                <Select value={formData.forma_pago} onValueChange={(v) => setFormData((p) => ({ ...p, forma_pago: v, destino: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{formData.forma_pago === 'efectivo' ? 'Caja Destino' : 'Cuenta Bancaria'}</Label>
                <Select value={formData.destino} onValueChange={(v) => setFormData((p) => ({ ...p, destino: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {formData.forma_pago === 'efectivo' ? (
                      cajas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} ({formatCurrency(c.saldo_actual)})</SelectItem>)
                    ) : (
                      cuentasBancarias.map((c) => <SelectItem key={c.id} value={c.id}>{c.banco} - {c.numero_cuenta}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit">{tipo === 'cobro' ? 'Registrar Cobro' : 'Registrar Pago'}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Letras Pendientes</CardTitle></CardHeader>
          <CardContent>
            {letras.filter((l) => l.estado !== 'pagada').length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin letras pendientes</p>
            ) : (
              <div className="space-y-2">
                {letras.filter((l) => l.estado !== 'pagada').slice(0, 10).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm">
                    <span>{l.numero} - {(l.tercero as any)?.razon_social}</span>
                    <span className="font-medium">{formatCurrency(l.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Cheques Pendientes</CardTitle></CardHeader>
          <CardContent>
            {cheques.filter((c) => c.estado === 'pendiente').length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cheques pendientes</p>
            ) : (
              <div className="space-y-2">
                {cheques.filter((c) => c.estado === 'pendiente').slice(0, 10).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.numero} - {c.banco}</span>
                    <span className="font-medium">{formatCurrency(c.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

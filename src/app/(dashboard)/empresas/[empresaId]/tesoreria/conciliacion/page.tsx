'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useTesoreria } from '@/lib/hooks/use-tesoreria'
import { ConciliacionTable } from '@/components/tesoreria/conciliacion-table'
import type { MovimientoBanco } from '@/types/tesoreria'
import { formatCurrency } from '@/lib/utils'

export default function ConciliacionPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { cuentasBancarias, loading, fetchMovimientosBanco, reconciliarMovimiento } = useTesoreria(empresaId)
  const [selectedCuenta, setSelectedCuenta] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoBanco[]>([])

  const loadMovimientos = async (cuentaId: string) => {
    const data = await fetchMovimientosBanco(cuentaId)
    setMovimientos(data.filter((m) => m.estado !== 'reconciliado'))
  }

  useEffect(() => {
    if (selectedCuenta) loadMovimientos(selectedCuenta)
  }, [selectedCuenta])

  const handleReconciliar = async (id: string) => {
    await reconciliarMovimiento(id)
    if (selectedCuenta) loadMovimientos(selectedCuenta)
  }

  const cuentaSeleccionada = cuentasBancarias.find((c) => c.id === selectedCuenta)

  if (loading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conciliación Bancaria</h1>
        <p className="text-muted-foreground">Conciliar movimientos bancarios con el libro mayor</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label>Cuenta Bancaria</Label>
          <Select value={selectedCuenta || ''} onValueChange={setSelectedCuenta}>
            <SelectTrigger><SelectValue placeholder="Seleccionar cuenta..." /></SelectTrigger>
            <SelectContent>
              {cuentasBancarias.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.banco} - {c.numero_cuenta}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {cuentaSeleccionada && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Saldo Libro</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{formatCurrency(cuentaSeleccionada.saldo_actual)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Movimientos Pendientes</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{movimientos.length}</div></CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedCuenta && (
        <ConciliacionTable movimientos={movimientos} onReconciliar={handleReconciliar} />
      )}
    </div>
  )
}

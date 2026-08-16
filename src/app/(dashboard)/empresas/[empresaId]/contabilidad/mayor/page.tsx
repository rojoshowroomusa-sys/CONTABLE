'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { usePlanCuentas } from '@/lib/hooks/use-plan-cuentas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MovimientoCuenta {
  fecha: string
  concepto: string
  debe: number
  haber: number
  saldo: number
}

interface MayorCuenta {
  cuenta_id: string
  codigo_cuenta: string
  nombre: string
  tipo: string
  movimientos: MovimientoCuenta[]
  totalDebe: number
  totalHaber: number
  saldoFinal: number
}

export default function MayorPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { cuentas } = usePlanCuentas(empresaId)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [movimientos, setMovimientos] = useState<MovimientoCuenta[]>([])
  const [loading, setLoading] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (!cuentaSeleccionada) {
      setMovimientos([])
      return
    }

    const fetchMovimientos = async () => {
      setLoading(true)
      let query = supabase
        .from('lineas_asiento')
        .select('debe, haber, asientos_contables(fecha, concepto)')
        .eq('cuenta_id', cuentaSeleccionada)

      if (fechaDesde) query = query.gte('asientos_contables.fecha', fechaDesde)
      if (fechaHasta) query = query.lte('asientos_contables.fecha', fechaHasta)

      const { data, error } = await query.order('asientos_contables.fecha')

      if (!error && data) {
        let saldo = 0
        const movs: MovimientoCuenta[] = data.map((linea: any) => {
          const debe = Number(linea.debe)
          const haber = Number(linea.haber)
          saldo += debe - haber
          return {
            fecha: linea.asientos_contables.fecha,
            concepto: linea.asientos_contables.concepto,
            debe,
            haber,
            saldo,
          }
        })
        setMovimientos(movs)
      }
      setLoading(false)
    }

    fetchMovimientos()
  }, [cuentaSeleccionada, fechaDesde, fechaHasta])

  const cuentaActual = cuentas.find((c) => c.id === cuentaSeleccionada)
  const totalDebe = movimientos.reduce((sum, m) => sum + m.debe, 0)
  const totalHaber = movimientos.reduce((sum, m) => sum + m.haber, 0)
  const saldoFinal = movimientos.length > 0 ? movimientos[movimientos.length - 1].saldo : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Libro Mayor</h1>
          <p className="text-muted-foreground">Detalle de movimientos por cuenta</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cuenta</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={cuentaSeleccionada}
                onChange={(e) => setCuentaSeleccionada(e.target.value)}
              >
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.codigo_cuenta} - {cuenta.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {cuentaSeleccionada && (
        <Card>
          <CardHeader>
            <CardTitle>
              {cuentaActual?.codigo_cuenta} - {cuentaActual?.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : movimientos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay movimientos para esta cuenta
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <div className="grid grid-cols-[100px_1fr_120px_120px_120px] gap-2 bg-muted p-2 text-sm font-medium">
                    <span>Fecha</span>
                    <span>Concepto</span>
                    <span className="text-right">Debe</span>
                    <span className="text-right">Haber</span>
                    <span className="text-right">Saldo</span>
                  </div>
                  {movimientos.map((mov, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[100px_1fr_120px_120px_120px] gap-2 border-t p-2 text-sm"
                    >
                      <span>{formatDate(mov.fecha)}</span>
                      <span>{mov.concepto}</span>
                      <span className="text-right">
                        {mov.debe > 0 ? formatCurrency(mov.debe) : ''}
                      </span>
                      <span className="text-right">
                        {mov.haber > 0 ? formatCurrency(mov.haber) : ''}
                      </span>
                      <span className={`text-right font-medium ${mov.saldo >= 0 ? '' : 'text-destructive'}`}>
                        {formatCurrency(Math.abs(mov.saldo))}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-[1fr_120px_120px_120px] gap-2 text-sm font-medium">
                  <span></span>
                  <span className="text-right">Totales</span>
                  <span className="text-right">{formatCurrency(totalDebe)}</span>
                  <span className="text-right">{formatCurrency(totalHaber)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BalanceItem {
  cuenta_id: string
  codigo_cuenta: string
  nombre: string
  tipo: string
  debe: number
  haber: number
  saldo: number
}

export default function BalancePage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const [items, setItems] = useState<BalanceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true)

      // Obtener cuentas
      const { data: cuentas } = await supabase
        .from('plan_cuentas')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('codigo_cuenta')

      if (!cuentas) {
        setLoading(false)
        return
      }

      // Obtener líneas de asiento
      let lineasQuery = supabase
        .from('lineas_asiento')
        .select('cuenta_id, debe, haber, asientos_contables!inner(empresa_id, fecha)')
        .eq('asientos_contables.empresa_id', empresaId)

      if (fechaDesde) lineasQuery = lineasQuery.gte('asientos_contables.fecha', fechaDesde)
      if (fechaHasta) lineasQuery = lineasQuery.lte('asientos_contables.fecha', fechaHasta)

      const { data: lineas } = await lineasQuery

      // Calcular saldos
      const saldos = new Map<string, { debe: number; haber: number }>()

      for (const linea of lineas || []) {
        const actual = saldos.get(linea.cuenta_id) || { debe: 0, haber: 0 }
        actual.debe += Number(linea.debe)
        actual.haber += Number(linea.haber)
        saldos.set(linea.cuenta_id, actual)
      }

      const balanceItems: BalanceItem[] = cuentas
        .map((cuenta) => {
          const saldosCuenta = saldos.get(cuenta.id) || { debe: 0, haber: 0 }
          let saldo = 0

          if (cuenta.tipo === 'activo' || cuenta.tipo === 'egreso') {
            saldo = saldosCuenta.debe - saldosCuenta.haber
          } else {
            saldo = saldosCuenta.haber - saldosCuenta.debe
          }

          return {
            cuenta_id: cuenta.id,
            codigo_cuenta: cuenta.codigo_cuenta,
            nombre: cuenta.nombre,
            tipo: cuenta.tipo,
            debe: saldosCuenta.debe,
            haber: saldosCuenta.haber,
            saldo,
          }
        })
        .filter((item) => item.debe > 0 || item.haber > 0)

      setItems(balanceItems)
      setLoading(false)
    }

    fetchBalance()
  }, [empresaId, fechaDesde, fechaHasta])

  const totalDebe = items.reduce((sum, i) => sum + i.debe, 0)
  const totalHaber = items.reduce((sum, i) => sum + i.haber, 0)
  const diferencia = totalDebe - totalHaber

  const activos = items.filter((i) => i.tipo === 'activo')
  const pasivos = items.filter((i) => i.tipo === 'pasivo')
  const patrimonio = items.filter((i) => i.tipo === 'patrimonio')
  const ingresos = items.filter((i) => i.tipo === 'ingreso')
  const egresos = items.filter((i) => i.tipo === 'egreso')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance de Comprobación</h1>
          <p className="text-muted-foreground">Resumen de saldos por cuenta</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
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

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Saldos por Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-[1fr_80px_120px_120px_120px] gap-2 bg-muted p-2 text-sm font-medium">
                  <span>Cuenta</span>
                  <span>Tipo</span>
                  <span className="text-right">Debe</span>
                  <span className="text-right">Haber</span>
                  <span className="text-right">Saldo</span>
                </div>
                {items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No hay movimientos para el rango seleccionado
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.cuenta_id}
                      className="grid grid-cols-[1fr_80px_120px_120px_120px] gap-2 border-t p-2 text-sm"
                    >
                      <span>{item.codigo_cuenta} - {item.nombre}</span>
                      <span className="capitalize text-muted-foreground">{item.tipo}</span>
                      <span className="text-right">{formatCurrency(item.debe)}</span>
                      <span className="text-right">{formatCurrency(item.haber)}</span>
                      <span className={`text-right font-medium ${item.saldo >= 0 ? '' : 'text-destructive'}`}>
                        {formatCurrency(Math.abs(item.saldo))}
                      </span>
                    </div>
                  ))
                )}
                <div className="grid grid-cols-[1fr_80px_120px_120px_120px] gap-2 border-t bg-muted/50 p-2 text-sm font-medium">
                  <span className="text-right">Totales</span>
                  <span></span>
                  <span className="text-right">{formatCurrency(totalDebe)}</span>
                  <span className="text-right">{formatCurrency(totalHaber)}</span>
                  <span className={`text-right ${diferencia === 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {diferencia === 0 ? 'CUADRADO' : `Diferencia: ${formatCurrency(Math.abs(diferencia))}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Activos', items: activos, color: 'text-blue-600' },
              { title: 'Pasivos', items: pasivos, color: 'text-red-600' },
              { title: 'Patrimonio', items: patrimonio, color: 'text-purple-600' },
              { title: 'Ingresos', items: ingresos, color: 'text-green-600' },
              { title: 'Egresos', items: egresos, color: 'text-orange-600' },
            ].map((grupo) => (
              <Card key={grupo.title}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${grupo.color}`}>{grupo.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(grupo.items.reduce((sum, i) => sum + Math.abs(i.saldo), 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">{grupo.items.length} cuentas</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

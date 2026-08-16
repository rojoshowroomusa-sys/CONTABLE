'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LibroIVAItem {
  fecha: string
  tipo_comprobante: string
  punto_venta: number
  numero: number
  identificacion_fiscal: string
  razon_social: string
  neto_gravado: number
  iva: number
  exento: number
  total: number
}

export default function LibroIVAPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const [ventas, setVentas] = useState<LibroIVAItem[]>([])
  const [compras, setCompras] = useState<LibroIVAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [tab, setTab] = useState<'ventas' | 'compras'>('ventas')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`
      const ultimoDia = new Date(anio, mes, 0).getDate()
      const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`

      // Ventas
      const { data: vData } = await supabase
        .from('comprobantes_fiscales')
        .select('*, puntos_venta(numero)')
        .eq('empresa_id', empresaId)
        .eq('operacion', 'venta')
        .eq('estado', 'emitido')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha')

      setVentas((vData || []).map((c: any) => ({
        fecha: c.fecha,
        tipo_comprobante: c.tipo,
        punto_venta: c.puntos_venta?.numero || 0,
        numero: c.numero,
        identificacion_fiscal: c.identificacion_fiscal,
        razon_social: c.razon_social,
        neto_gravado: Number(c.neto_gravado),
        iva: Number(c.iva),
        exento: Number(c.exento),
        total: Number(c.total),
      })))

      // Compras
      const { data: cData } = await supabase
        .from('comprobantes_fiscales')
        .select('*, puntos_venta(numero)')
        .eq('empresa_id', empresaId)
        .eq('operacion', 'compra')
        .eq('estado', 'emitido')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha')

      setCompras((cData || []).map((c: any) => ({
        fecha: c.fecha,
        tipo_comprobante: c.tipo,
        punto_venta: c.puntos_venta?.numero || 0,
        numero: c.numero,
        identificacion_fiscal: c.identificacion_fiscal,
        razon_social: c.razon_social,
        neto_gravado: Number(c.neto_gravado),
        iva: Number(c.iva),
        exento: Number(c.exento),
        total: Number(c.total),
      })))

      setLoading(false)
    }

    fetchData()
  }, [empresaId, mes, anio])

  const items = tab === 'ventas' ? ventas : compras
  const totalNeto = items.reduce((sum, i) => sum + i.neto_gravado, 0)
  const totalIVA = items.reduce((sum, i) => sum + i.iva, 0)
  const totalExento = items.reduce((sum, i) => sum + i.exento, 0)
  const totalGeneral = items.reduce((sum, i) => sum + i.total, 0)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Libro IVA Digital</h1>
          <p className="text-muted-foreground">Registro mensual de IVA</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CITI
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
              >
                {meses.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input
                type="number"
                value={anio}
                onChange={(e) => setAnio(parseInt(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant={tab === 'ventas' ? 'default' : 'outline'}
          onClick={() => setTab('ventas')}
        >
          Libro IVA Ventas ({ventas.length})
        </Button>
        <Button
          variant={tab === 'compras' ? 'default' : 'outline'}
          onClick={() => setTab('compras')}
        >
          Libro IVA Compras ({compras.length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {tab === 'ventas' ? 'Libro IVA Ventas' : 'Libro IVA Compras'} - {meses[mes - 1]} {anio}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left text-xs font-medium">Fecha</th>
                  <th className="p-2 text-left text-xs font-medium">Tipo</th>
                  <th className="p-2 text-left text-xs font-medium">PV</th>
                  <th className="p-2 text-left text-xs font-medium">Número</th>
                  <th className="p-2 text-left text-xs font-medium">CUIT</th>
                  <th className="p-2 text-left text-xs font-medium">Razón Social</th>
                  <th className="p-2 text-right text-xs font-medium">Neto</th>
                  <th className="p-2 text-right text-xs font-medium">IVA</th>
                  <th className="p-2 text-right text-xs font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                      No hay comprobantes para este período
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 text-xs">{item.fecha}</td>
                      <td className="p-2 text-xs uppercase">{item.tipo_comprobante}</td>
                      <td className="p-2 text-xs">{String(item.punto_venta).padStart(5, '0')}</td>
                      <td className="p-2 text-xs">{String(item.numero).padStart(8, '0')}</td>
                      <td className="p-2 text-xs">{item.identificacion_fiscal}</td>
                      <td className="p-2 text-xs truncate max-w-[150px]">{item.razon_social}</td>
                      <td className="p-2 text-xs text-right">{formatCurrency(item.neto_gravado)}</td>
                      <td className="p-2 text-xs text-right">{formatCurrency(item.iva)}</td>
                      <td className="p-2 text-xs text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="border-t bg-muted/50 font-bold">
                    <td colSpan={6} className="p-2 text-xs text-right">Totales</td>
                    <td className="p-2 text-xs text-right">{formatCurrency(totalNeto)}</td>
                    <td className="p-2 text-xs text-right">{formatCurrency(totalIVA)}</td>
                    <td className="p-2 text-xs text-right">{formatCurrency(totalGeneral)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

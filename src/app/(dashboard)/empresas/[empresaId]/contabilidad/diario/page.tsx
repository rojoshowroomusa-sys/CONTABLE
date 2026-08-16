'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAsientos } from '@/lib/hooks/use-asientos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Download } from 'lucide-react'

export default function DiarioPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { asientos, loading, fetchAsientos } = useAsientos(empresaId)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    fetchAsientos({
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
    })
  }, [fechaDesde, fechaHasta])

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
          <h1 className="text-3xl font-bold tracking-tight">Libro Diario</h1>
          <p className="text-muted-foreground">Registro cronológico de asientos contables</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Asientos ({asientos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {asientos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay asientos en el rango seleccionado
            </div>
          ) : (
            <div className="space-y-4">
              {asientos.map((asiento) => (
                <div key={asiento.id} className="rounded-md border">
                  <div className="flex items-center justify-between border-b bg-muted/50 p-3">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm">{formatDate(asiento.fecha)}</span>
                      <span className="font-medium">{asiento.concepto}</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      asiento.estado === 'asentado' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {asiento.estado.toUpperCase()}
                    </span>
                  </div>
                  <div className="divide-y">
                    {asiento.lineas?.map((linea) => (
                      <div key={linea.id} className="grid grid-cols-[1fr_120px_120px] gap-2 px-3 py-2 text-sm">
                        <span className="pl-4">
                          {linea.cuenta?.codigo_cuenta} - {linea.cuenta?.nombre}
                        </span>
                        <span className="text-right">
                          {Number(linea.debe) > 0 ? formatCurrency(Number(linea.debe)) : ''}
                        </span>
                        <span className="text-right">
                          {Number(linea.haber) > 0 ? formatCurrency(Number(linea.haber)) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-[1fr_120px_120px] gap-2 border-t bg-muted/30 px-3 py-2 text-sm font-medium">
                    <span className="text-right">Totales</span>
                    <span className="text-right">
                      {formatCurrency(asiento.lineas?.reduce((sum, l) => sum + Number(l.debe), 0) || 0)}
                    </span>
                    <span className="text-right">
                      {formatCurrency(asiento.lineas?.reduce((sum, l) => sum + Number(l.haber), 0) || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

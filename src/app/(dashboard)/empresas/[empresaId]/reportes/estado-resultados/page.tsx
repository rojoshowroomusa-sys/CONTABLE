'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useReportes } from '@/lib/hooks/use-reportes'
import { ReporteResultados } from '@/components/reportes/reporte-resultados'
import type { EstadoResultados } from '@/types/reportes'
import { formatCurrency } from '@/lib/utils'

export default function EstadoResultadosPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { loading, fetchEstadoResultados } = useReportes()
  const [resultados, setResultados] = useState<EstadoResultados | null>(null)
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  const handleGenerar = async () => {
    const data = await fetchEstadoResultados({ empresa_id: empresaId, fecha_desde: fechaDesde, fecha_hasta: fechaHasta })
    setResultados(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estado de Resultados</h1>
          <p className="text-muted-foreground">Resultado económico del período</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Parámetros del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <Label>Fecha Desde</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>
            <div>
              <Label>Fecha Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
            <Button onClick={handleGenerar} disabled={loading}>
              {loading ? 'Generando...' : 'Generar Resultados'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !resultados && <Skeleton className="h-[400px] w-full" />}

      {resultados && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Resultado Operativo</CardTitle></CardHeader>
              <CardContent><div className={`text-xl font-bold ${resultados.resultado_operativo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(resultados.resultado_operativo)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Impuestos</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold text-red-600">{formatCurrency(resultados.impuestos)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Resultado Neto</CardTitle></CardHeader>
              <CardContent><div className={`text-xl font-bold ${resultados.resultado_neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(resultados.resultado_neto)}</div></CardContent>
            </Card>
          </div>
          <ReporteResultados data={resultados} />
        </>
      )}
    </div>
  )
}

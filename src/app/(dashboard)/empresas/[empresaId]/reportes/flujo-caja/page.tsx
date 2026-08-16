'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useReportes } from '@/lib/hooks/use-reportes'
import { ReporteFlujo } from '@/components/reportes/reporte-flujo'
import type { FlujoCaja } from '@/types/reportes'
import { formatCurrency } from '@/lib/utils'

export default function FlujoCajaPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { loading, fetchFlujoCaja } = useReportes()
  const [flujo, setFlujo] = useState<FlujoCaja | null>(null)
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  const handleGenerar = async () => {
    const data = await fetchFlujoCaja({ empresa_id: empresaId, fecha_desde: fechaDesde, fecha_hasta: fechaHasta })
    setFlujo(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flujo de Caja</h1>
          <p className="text-muted-foreground">Movimientos de efectivo del período</p>
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
              {loading ? 'Generando...' : 'Generar Flujo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !flujo && <Skeleton className="h-[400px] w-full" />}

      {flujo && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Flujo Operativo</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{formatCurrency(flujo.total_operacion)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Flujo de Inversión</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{formatCurrency(flujo.total_inversion)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Flujo de Financiamiento</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{formatCurrency(flujo.total_financiamiento)}</div></CardContent>
            </Card>
          </div>
          <ReporteFlujo data={flujo} />
        </>
      )}
    </div>
  )
}

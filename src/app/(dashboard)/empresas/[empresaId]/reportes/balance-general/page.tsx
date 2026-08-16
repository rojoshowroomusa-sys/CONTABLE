'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useReportes } from '@/lib/hooks/use-reportes'
import { ReporteBalance } from '@/components/reportes/reporte-balance'
import type { BalanceGeneral } from '@/types/reportes'
import { formatCurrency } from '@/lib/utils'

export default function BalanceGeneralPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { loading, fetchBalanceGeneral } = useReportes()
  const [balance, setBalance] = useState<BalanceGeneral | null>(null)
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  const handleGenerar = async () => {
    const data = await fetchBalanceGeneral({ empresa_id: empresaId, fecha_desde: '2024-01-01', fecha_hasta: fechaHasta })
    setBalance(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance General</h1>
          <p className="text-muted-foreground">Estado de situación patrimonial al cierre del período</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Parámetros del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <Label>Fecha de Cierre</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>
            <Button onClick={handleGenerar} disabled={loading}>
              {loading ? 'Generando...' : 'Generar Balance'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !balance && <Skeleton className="h-[400px] w-full" />}

      {balance && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total Activo</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{formatCurrency(balance.total_activo)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total Pasivo</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{formatCurrency(balance.total_pasivo)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Patrimonio Neto</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold">{formatCurrency(balance.total_patrimonio)}</div></CardContent>
            </Card>
          </div>
          <ReporteBalance data={balance} />
        </>
      )}
    </div>
  )
}

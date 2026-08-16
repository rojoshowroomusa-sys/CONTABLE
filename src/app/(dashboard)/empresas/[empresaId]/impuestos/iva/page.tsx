'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useImpuestos } from '@/lib/hooks/use-impuestos'
import { CalculoIVA } from '@/components/impuestos/calculo-iva'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function IVAPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { fetchResumen, loading } = useImpuestos(empresaId)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [debitoFiscal, setDebitoFiscal] = useState(0)
  const [creditoFiscal, setCreditoFiscal] = useState(0)

  useEffect(() => {
    const cargarResumen = async () => {
      const resumen = await fetchResumen(fechaDesde || undefined, fechaHasta || undefined)
      if (resumen) {
        setDebitoFiscal(resumen.ivaDebitoFiscal)
        setCreditoFiscal(resumen.ivaCreditoFiscal)
      }
    }
    cargarResumen()
  }, [fechaDesde, fechaHasta])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IVA</h1>
          <p className="text-muted-foreground">Resumen de IVA débito y crédito fiscal</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
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

      <CalculoIVA debitoFiscal={debitoFiscal} creditoFiscal={creditoFiscal} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Alícuota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[100px_1fr_1fr] gap-2 bg-muted p-2 text-sm font-medium">
              <span>Alícuota</span>
              <span className="text-right">Débito Fiscal</span>
              <span className="text-right">Crédito Fiscal</span>
            </div>
            {[21, 10.5, 27, 0].map((alicuota) => (
              <div key={alicuota} className="grid grid-cols-[100px_1fr_1fr] gap-2 border-t p-2 text-sm">
                <span>{alicuota}%</span>
                <span className="text-right">{formatCurrency(debitoFiscal * (alicuota / 21))}</span>
                <span className="text-right">{formatCurrency(creditoFiscal * (alicuota / 21))}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

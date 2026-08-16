'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { FlujoCaja } from '@/types/reportes'

interface ReporteFlujoProps {
  data: FlujoCaja
}

function SeccionFlujo({ titulo, items, total, color }: { titulo: string; items: { concepto: string; monto: number }[]; total: number; color: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`text-sm ${color}`}>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Sin datos</div>
          ) : (
            items.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_120px] gap-2 border-t p-2 text-sm">
                <span className="truncate">{l.concepto}</span>
                <span className="text-right font-medium">{formatCurrency(l.monto)}</span>
              </div>
            ))
          )}
          <div className="grid grid-cols-[1fr_120px] gap-2 border-t-2 bg-muted p-2 text-sm font-bold">
            <span>Total {titulo}</span>
            <span className="text-right">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReporteFlujo({ data }: ReporteFlujoProps) {
  return (
    <div className="space-y-6">
      <SeccionFlujo titulo="ACTIVIDADES OPERATIVAS" items={data.operacion} total={data.total_operacion} color="text-blue-600" />
      <SeccionFlujo titulo="ACTIVIDADES DE INVERSIÓN" items={data.inversion} total={data.total_inversion} color="text-purple-600" />
      <SeccionFlujo titulo="ACTIVIDADES DE FINANCIAMIENTO" items={data.financiamiento} total={data.total_financiamiento} color="text-green-600" />

      <Card className="border-primary">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Saldo Inicial</span>
            <span>{formatCurrency(data.saldo_inicial)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Flujo Neto</span>
            <span className={`font-medium ${data.flujo_neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.flujo_neto)}
            </span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-lg font-bold">SALDO FINAL</span>
            <span className="text-lg font-bold">{formatCurrency(data.saldo_final)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

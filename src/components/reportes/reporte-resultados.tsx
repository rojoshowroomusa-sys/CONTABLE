'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { EstadoResultados } from '@/types/reportes'

interface ReporteResultadosProps {
  data: EstadoResultados
}

function SeccionResultado({ titulo, items, total }: { titulo: string; items: { cuenta_codigo: string; cuenta_nombre: string; monto: number }[]; total: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Sin datos</div>
          ) : (
            items.map((l, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr_120px] gap-2 border-t p-2 text-sm">
                <span className="font-mono text-xs">{l.cuenta_codigo}</span>
                <span className="truncate">{l.cuenta_nombre}</span>
                <span className={`text-right font-medium ${l.monto > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(l.monto))}
                </span>
              </div>
            ))
          )}
          <div className="grid grid-cols-[120px_1fr_120px] gap-2 border-t-2 bg-muted p-2 text-sm font-bold">
            <span></span>
            <span>Total</span>
            <span className="text-right">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReporteResultados({ data }: ReporteResultadosProps) {
  const totalIngresos = data.ingresos_operativos.reduce((sum, l) => sum + Math.abs(l.monto), 0) +
    data.otros_ingresos.reduce((sum, l) => sum + Math.abs(l.monto), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <SeccionResultado titulo="INGRESOS OPERATIVOS" items={data.ingresos_operativos} total={data.ingresos_operativos.reduce((s, l) => s + Math.abs(l.monto), 0)} />
          <SeccionResultado titulo="OTROS INGRESOS" items={data.otros_ingresos} total={data.otros_ingresos.reduce((s, l) => s + Math.abs(l.monto), 0)} />
        </div>
        <div className="space-y-6">
          <SeccionResultado titulo="EGRESOS OPERATIVOS" items={data.egresos_operativos} total={data.egresos_operativos.reduce((s, l) => s + Math.abs(l.monto), 0)} />
          <SeccionResultado titulo="OTROS EGRESOS" items={data.otros_egresos} total={data.otros_egresos.reduce((s, l) => s + Math.abs(l.monto), 0)} />
        </div>
      </div>

      <Card className="border-primary">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">Resultado Operativo</span>
            <span className={`font-bold ${data.resultado_operativo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.resultado_operativo)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Impuestos</span>
            <span className="text-red-600">({formatCurrency(data.impuestos)})</span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between">
            <span className="text-lg font-bold">RESULTADO NETO</span>
            <span className={`text-lg font-bold ${data.resultado_neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.resultado_neto)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

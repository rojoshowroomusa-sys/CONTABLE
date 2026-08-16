'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface ResumenImpuestosProps {
  retenciones: { tipo: string; monto: number }[]
  percepciones: { tipo: string; monto: number }[]
  totalRetenciones: number
  totalPercepciones: number
}

const tipoLabels: Record<string, string> = {
  iva: 'IVA',
  ganancias: 'Ganancias',
  iibb: 'IIBB',
  suss: 'SUSS',
  honorarios: 'Honorarios',
  otros: 'Otros',
}

export function ResumenImpuestos({
  retenciones,
  percepciones,
  totalRetenciones,
  totalPercepciones,
}: ResumenImpuestosProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Retenciones</CardTitle>
        </CardHeader>
        <CardContent>
          {retenciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin retenciones</p>
          ) : (
            <div className="space-y-2">
              {retenciones.map((r) => (
                <div key={r.tipo} className="flex justify-between text-sm">
                  <span>{tipoLabels[r.tipo] || r.tipo}</span>
                  <span className="font-medium text-red-600">{formatCurrency(r.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm font-bold">
                <span>Total Retenciones</span>
                <span className="text-red-600">{formatCurrency(totalRetenciones)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Percepciones</CardTitle>
        </CardHeader>
        <CardContent>
          {percepciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin percepciones</p>
          ) : (
            <div className="space-y-2">
              {percepciones.map((p) => (
                <div key={p.tipo} className="flex justify-between text-sm">
                  <span>{tipoLabels[p.tipo] || p.tipo}</span>
                  <span className="font-medium text-green-600">{formatCurrency(p.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm font-bold">
                <span>Total Percepciones</span>
                <span className="text-green-600">{formatCurrency(totalPercepciones)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

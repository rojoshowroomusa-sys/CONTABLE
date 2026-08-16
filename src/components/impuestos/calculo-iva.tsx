'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface CalculoIVAProps {
  debitoFiscal: number
  creditoFiscal: number
}

export function CalculoIVA({ debitoFiscal, creditoFiscal }: CalculoIVAProps) {
  const saldo = debitoFiscal - creditoFiscal
  const aPagar = saldo > 0
  const monto = Math.abs(saldo)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-600">IVA Débito Fiscal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(debitoFiscal)}</p>
          <p className="text-xs text-muted-foreground">IVA cobrado en ventas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-green-600">IVA Crédito Fiscal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(creditoFiscal)}</p>
          <p className="text-xs text-muted-foreground">IVA pagado en compras</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={`text-sm ${aPagar ? 'text-red-600' : 'text-green-600'}`}>
            {aPagar ? 'IVA a Pagar' : 'Saldo a Favor'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${aPagar ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(monto)}
          </p>
          <p className="text-xs text-muted-foreground">
            {aPagar ? 'Declaración Jurada' : 'Crédito fiscal acumulado'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

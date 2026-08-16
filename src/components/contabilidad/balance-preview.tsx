'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { BalanceCuenta } from '@/types/contabilidad'

interface BalancePreviewProps {
  cuentas: BalanceCuenta[]
  totales: {
    debe: number
    haber: number
    diferencia: number
  }
}

export function BalancePreview({ cuentas, totales }: BalancePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Balance de Comprobación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 bg-muted p-2 text-sm font-medium">
            <span>Cuenta</span>
            <span className="text-right">Debe</span>
            <span className="text-right">Haber</span>
            <span className="text-right">Saldo</span>
          </div>
          {cuentas.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Sin movimientos
            </div>
          ) : (
            cuentas.map((cuenta) => (
              <div
                key={cuenta.cuenta_id}
                className="grid grid-cols-[1fr_100px_100px_100px] gap-2 border-t p-2 text-sm"
              >
                <span className="truncate">
                  {cuenta.codigo_cuenta} - {cuenta.nombre}
                </span>
                <span className="text-right">{formatCurrency(cuenta.total_debe)}</span>
                <span className="text-right">{formatCurrency(cuenta.total_haber)}</span>
                <span className={`text-right font-medium ${cuenta.saldo >= 0 ? '' : 'text-destructive'}`}>
                  {formatCurrency(Math.abs(cuenta.saldo))}
                </span>
              </div>
            ))
          )}
          <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 border-t bg-muted/50 p-2 text-sm font-medium">
            <span className="text-right">Totales</span>
            <span className="text-right">{formatCurrency(totales.debe)}</span>
            <span className="text-right">{formatCurrency(totales.haber)}</span>
            <span className={`text-right ${totales.diferencia === 0 ? 'text-green-600' : 'text-destructive'}`}>
              {totales.diferencia === 0 ? 'Cuadrado' : formatCurrency(Math.abs(totales.diferencia))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

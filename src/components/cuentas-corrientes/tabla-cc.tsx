'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { CuentaCorriente, MovimientoCC } from '@/types/cuentas-corrientes'

interface TablaCuentaCorrienteProps {
  cuenta: CuentaCorriente
  movimientos: MovimientoCC[]
}

const tipoBadgeColor: Record<string, string> = {
  factura_venta: 'bg-blue-100 text-blue-800',
  factura_compra: 'bg-purple-100 text-purple-800',
  pago: 'bg-green-100 text-green-800',
  cobro: 'bg-green-100 text-green-800',
  nota_credito: 'bg-yellow-100 text-yellow-800',
  nota_debito: 'bg-red-100 text-red-800',
  recibo: 'bg-teal-100 text-teal-800',
}

export function TablaCuentaCorriente({ cuenta, movimientos }: TablaCuentaCorrienteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Movimientos de Cuenta Corriente</span>
          <span className="text-sm font-normal text-muted-foreground">
            Saldo: <span className="font-bold text-foreground">{formatCurrency(cuenta.saldo)}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[100px_1fr_140px_140px_140px_100px] gap-2 bg-muted p-2 text-xs font-medium">
            <span>Fecha</span>
            <span>Descripción</span>
            <span>Tipo</span>
            <span className="text-right">Débito</span>
            <span className="text-right">Crédito</span>
            <span className="text-right">Saldo</span>
          </div>
          {movimientos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Sin movimientos registrados
            </div>
          ) : (
            movimientos.map((mov) => (
              <div key={mov.id} className="grid grid-cols-[100px_1fr_140px_140px_140px_100px] gap-2 border-t p-2 text-sm">
                <span>{formatDate(mov.fecha)}</span>
                <span className="truncate">{mov.descripcion}</span>
                <Badge variant="secondary" className={tipoBadgeColor[mov.tipo]}>
                  {mov.tipo.replace('_', ' ')}
                </Badge>
                <span className="text-right">{mov.debito > 0 ? formatCurrency(mov.debito) : '-'}</span>
                <span className="text-right">{mov.credito > 0 ? formatCurrency(mov.credito) : '-'}</span>
                <span className="text-right font-medium">{formatCurrency(mov.saldo)}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

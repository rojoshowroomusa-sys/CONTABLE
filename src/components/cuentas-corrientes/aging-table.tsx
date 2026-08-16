'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { AgingItem } from '@/types/cuentas-corrientes'

interface AgingTableProps {
  items: AgingItem[]
  title: string
}

export function AgingTable({ items, title }: AgingTableProps) {
  const totales = items.reduce(
    (acc, item) => ({
      saldo_total: acc.saldo_total + item.saldo_total,
      corriente: acc.corriente + item.corriente,
      vencido_30: acc.vencido_30 + item.vencido_30,
      vencido_60: acc.vencido_60 + item.vencido_60,
      vencido_90: acc.vencido_90 + item.vencido_90,
    }),
    { saldo_total: 0, corriente: 0, vencido_30: 0, vencido_60: 0, vencido_90: 0 }
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px_100px] gap-2 bg-muted p-2 text-xs font-medium">
            <span>Sujeto</span>
            <span className="text-right">Saldo Total</span>
            <span className="text-right text-green-600">Corriente</span>
            <span className="text-right text-yellow-600">1-30 días</span>
            <span className="text-right text-orange-600">31-60 días</span>
            <span className="text-right text-red-600">61+ días</span>
          </div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Sin saldos pendientes
            </div>
          ) : (
            items.map((item) => (
              <div key={item.tercero_id} className="grid grid-cols-[1fr_100px_100px_100px_100px_100px] gap-2 border-t p-2 text-sm">
                <span className="truncate">{item.razon_social}</span>
                <span className="text-right font-medium">{formatCurrency(item.saldo_total)}</span>
                <span className="text-right text-green-600">{formatCurrency(item.corriente)}</span>
                <span className="text-right text-yellow-600">{formatCurrency(item.vencido_30)}</span>
                <span className="text-right text-orange-600">{formatCurrency(item.vencido_60)}</span>
                <span className="text-right text-red-600">{formatCurrency(item.vencido_90)}</span>
              </div>
            ))
          )}
          {items.length > 0 && (
            <div className="grid grid-cols-[1fr_100px_100px_100px_100px_100px] gap-2 border-t bg-muted/50 p-2 text-sm font-bold">
              <span>Totales</span>
              <span className="text-right">{formatCurrency(totales.saldo_total)}</span>
              <span className="text-right text-green-600">{formatCurrency(totales.corriente)}</span>
              <span className="text-right text-yellow-600">{formatCurrency(totales.vencido_30)}</span>
              <span className="text-right text-orange-600">{formatCurrency(totales.vencido_60)}</span>
              <span className="text-right text-red-600">{formatCurrency(totales.vencido_90)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

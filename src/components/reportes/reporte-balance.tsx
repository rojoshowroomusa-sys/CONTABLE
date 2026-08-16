'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { BalanceGeneral } from '@/types/reportes'

interface ReporteBalanceProps {
  data: BalanceGeneral
}

function LineaCuenta({ codigo, nombre, monto, nivel }: { codigo: string; nombre: string; monto: number; nivel: number }) {
  return (
    <div className={`grid grid-cols-[120px_1fr_120px] gap-2 border-t p-2 text-sm ${nivel > 0 ? 'pl-' + (nivel * 4) : ''}`}>
      <span className="font-mono text-xs">{codigo}</span>
      <span className="truncate">{nombre}</span>
      <span className="text-right font-medium">{formatCurrency(monto)}</span>
    </div>
  )
}

export function ReporteBalance({ data }: ReporteBalanceProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ACTIVO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              {data.activo.map((l, i) => (
                <LineaCuenta key={i} codigo={l.cuenta_codigo} nombre={l.cuenta_nombre} monto={l.saldo_deudor || l.saldo_acreedor} nivel={l.nivel} />
              ))}
              <div className="grid grid-cols-[120px_1fr_120px] gap-2 border-t-2 bg-muted p-2 text-sm font-bold">
                <span></span>
                <span>TOTAL ACTIVO</span>
                <span className="text-right">{formatCurrency(data.total_activo)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PASIVO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                {data.pasivo.map((l, i) => (
                  <LineaCuenta key={i} codigo={l.cuenta_codigo} nombre={l.cuenta_nombre} monto={l.saldo_acreedor || l.saldo_deudor} nivel={l.nivel} />
                ))}
                <div className="grid grid-cols-[120px_1fr_120px] gap-2 border-t-2 bg-muted p-2 text-sm font-bold">
                  <span></span>
                  <span>TOTAL PASIVO</span>
                  <span className="text-right">{formatCurrency(data.total_pasivo)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PATRIMONIO NETO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                {data.patrimonio.map((l, i) => (
                  <LineaCuenta key={i} codigo={l.cuenta_codigo} nombre={l.cuenta_nombre} monto={l.saldo_acreedor || l.saldo_deudor} nivel={l.nivel} />
                ))}
                <div className="grid grid-cols-[120px_1fr_120px] gap-2 border-t-2 bg-muted p-2 text-sm font-bold">
                  <span></span>
                  <span>TOTAL PATRIMONIO</span>
                  <span className="text-right">{formatCurrency(data.total_patrimonio)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={data.total_activo === (data.total_pasivo + data.total_patrimonio) ? 'border-green-500' : 'border-red-500'}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">Verificación:</span>
                <span>
                  {formatCurrency(data.total_activo)} = {formatCurrency(data.total_pasivo)} + {formatCurrency(data.total_patrimonio)}
                  {data.total_activo === (data.total_pasivo + data.total_patrimonio) ? ' ✓' : ' ✗'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

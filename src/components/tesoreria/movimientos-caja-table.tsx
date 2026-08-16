'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { MovimientoCaja } from '@/types/tesoreria'

interface MovimientosCajaTableProps {
  movimientos: MovimientoCaja[]
}

const estadoColor: Record<string, string> = {
  confirmado: 'bg-green-100 text-green-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  anulado: 'bg-red-100 text-red-800',
}

export function MovimientosCajaTable({ movimientos }: MovimientosCajaTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Movimientos de Caja</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[100px_1fr_100px_120px_120px_120px_100px] gap-2 bg-muted p-2 text-xs font-medium">
            <span>Fecha</span>
            <span>Descripción</span>
            <span>Tipo</span>
            <span>Saldo Ant.</span>
            <span>Monto</span>
            <span>Saldo Post.</span>
            <span>Estado</span>
          </div>
          {movimientos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin movimientos</div>
          ) : (
            movimientos.map((m) => (
              <div key={m.id} className="grid grid-cols-[100px_1fr_100px_120px_120px_120px_100px] gap-2 border-t p-2 text-sm">
                <span>{formatDate(m.fecha)}</span>
                <span className="truncate">{m.descripcion}</span>
                <Badge variant="secondary" className={m.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {m.tipo}
                </Badge>
                <span className="text-right">{formatCurrency(m.saldo_anterior)}</span>
                <span className={`text-right font-medium ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
                </span>
                <span className="text-right font-medium">{formatCurrency(m.saldo_posterior)}</span>
                <Badge variant="secondary" className={estadoColor[m.estado]}>{m.estado}</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { MovimientoBanco } from '@/types/tesoreria'

interface ConciliacionTableProps {
  movimientos: MovimientoBanco[]
  onReconciliar: (id: string) => void
}

const tipoLabel: Record<string, string> = {
  deposito: 'Depósito',
  retiro: 'Retiro',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  intereses: 'Intereses',
  comision: 'Comisión',
  otro: 'Otro',
}

const estadoColor: Record<string, string> = {
  reconciliado: 'bg-green-100 text-green-800',
  en_banco: 'bg-blue-100 text-blue-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
}

export function ConciliacionTable({ movimientos, onReconciliar }: ConciliacionTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Movimientos para Conciliar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[100px_1fr_100px_120px_120px_120px_120px] gap-2 bg-muted p-2 text-xs font-medium">
            <span>Fecha</span>
            <span>Descripción</span>
            <span>Tipo</span>
            <span>Saldo Ant.</span>
            <span>Monto</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {movimientos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin movimientos pendientes</div>
          ) : (
            movimientos.map((m) => (
              <div key={m.id} className="grid grid-cols-[100px_1fr_100px_120px_120px_120px_120px] gap-2 border-t p-2 text-sm">
                <span>{formatDate(m.fecha)}</span>
                <span className="truncate">{m.descripcion}</span>
                <span>{tipoLabel[m.tipo] || m.tipo}</span>
                <span className="text-right">{formatCurrency(m.saldo_anterior)}</span>
                <span className="text-right font-medium">{formatCurrency(m.monto)}</span>
                <Badge variant="secondary" className={estadoColor[m.estado]}>{m.estado}</Badge>
                <div>
                  {m.estado !== 'reconciliado' && (
                    <Button variant="ghost" size="sm" onClick={() => onReconciliar(m.id)}>
                      Conciliar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

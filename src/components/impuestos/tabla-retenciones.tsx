'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface TablaRetencionesProps {
  retenciones: {
    id: string
    fecha: string
    tipo: string
    numero: string
    razon_social: string
    identificacion_fiscal: string
    base_imponible: number
    alicuota: number
    monto: number
    constancia: string | null
  }[]
  onDelete?: (id: string) => void
}

const tipoLabels: Record<string, string> = {
  iva: 'IVA',
  ganancias: 'Ganancias',
  iibb: 'IIBB',
  suss: 'SUSS',
  honorarios: 'Honorarios',
  otros: 'Otros',
}

export function TablaRetenciones({ retenciones, onDelete }: TablaRetencionesProps) {
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[80px_60px_1fr_100px_60px_100px] gap-2 bg-muted p-2 text-xs font-medium">
        <span>Fecha</span>
        <span>Tipo</span>
        <span>Sujeto</span>
        <span className="text-right">Base Imp.</span>
        <span className="text-right">Alíq.</span>
        <span className="text-right">Monto</span>
      </div>
      {retenciones.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No hay retenciones registradas
        </div>
      ) : (
        retenciones.map((r) => (
          <div key={r.id} className="grid grid-cols-[80px_60px_1fr_100px_60px_100px] gap-2 border-t p-2 text-sm items-center">
            <span className="text-xs">{r.fecha}</span>
            <span className="text-xs">{tipoLabels[r.tipo] || r.tipo}</span>
            <span className="truncate text-xs">{r.razon_social}</span>
            <span className="text-right text-xs">{formatCurrency(r.base_imponible)}</span>
            <span className="text-right text-xs">{r.alicuota}%</span>
            <span className="text-right text-xs font-medium text-red-600">{formatCurrency(r.monto)}</span>
          </div>
        ))
      )}
      {retenciones.length > 0 && (
        <div className="grid grid-cols-[80px_60px_1fr_100px_60px_100px] gap-2 border-t bg-muted/50 p-2 text-sm font-bold">
          <span className="col-span-4 text-right">Total Retenciones</span>
          <span className="text-right text-red-600">
            {formatCurrency(retenciones.reduce((sum, r) => sum + Number(r.monto), 0))}
          </span>
        </div>
      )}
    </div>
  )
}

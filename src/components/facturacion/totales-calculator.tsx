'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { ItemComprobante } from '@/types/facturacion'

interface TotalesCalculatorProps {
  items: ItemComprobante[]
  showIva?: boolean
}

export function TotalesCalculator({ items, showIva = true }: TotalesCalculatorProps) {
  const netoGravado = items
    .filter((i) => i.alicuota_iva > 0)
    .reduce((sum, i) => sum + i.subtotal, 0)

  const iva = items
    .filter((i) => i.alicuota_iva > 0)
    .reduce((sum, i) => sum + i.subtotal * (i.alicuota_iva / 100), 0)

  const exento = items
    .filter((i) => i.alicuota_iva === 0)
    .reduce((sum, i) => sum + i.subtotal, 0)

  const total = netoGravado + iva + exento

  // Desglose por alícuota
  const desglose = items
    .filter((i) => i.alicuota_iva > 0)
    .reduce((acc, item) => {
      const key = item.alicuota_iva
      if (!acc[key]) acc[key] = { base: 0, monto: 0 }
      acc[key].base += item.subtotal
      acc[key].monto += item.subtotal * (item.alicuota_iva / 100)
      return acc
    }, {} as Record<number, { base: number; monto: number }>)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Resumen de Totales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Neto Gravado:</span>
          <span>{formatCurrency(netoGravado)}</span>
        </div>
        {showIva && Object.entries(desglose).map(([alicuota, datos]) => (
          <div key={alicuota} className="flex justify-between text-sm pl-4">
            <span>IVA {alicuota}% (base: {formatCurrency(datos.base)}):</span>
            <span>{formatCurrency(datos.monto)}</span>
          </div>
        ))}
        {showIva && (
          <div className="flex justify-between text-sm font-medium">
            <span>Total IVA:</span>
            <span>{formatCurrency(iva)}</span>
          </div>
        )}
        {exento > 0 && (
          <div className="flex justify-between text-sm">
            <span>Exento:</span>
            <span>{formatCurrency(exento)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

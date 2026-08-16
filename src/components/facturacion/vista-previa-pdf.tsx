'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import type { ComprobanteFiscal } from '@/types/facturacion'

interface VistaPreviaPDFProps {
  comprobante: ComprobanteFiscal
  empresaRazonSocial?: string
  empresaCuit?: string
}

export function VistaPreviaPDF({
  comprobante,
  empresaRazonSocial = 'Sistema Contable',
  empresaCuit = 'XX-XXXXXXXX-X',
}: VistaPreviaPDFProps) {
  const tipoLabel: Record<string, string> = {
    factura_a: 'FACTURA A',
    factura_b: 'FACTURA B',
    factura_c: 'FACTURA C',
    nota_credito: 'NOTA DE CRÉDITO',
    nota_debito: 'NOTA DE DÉBITO',
    presupuesto: 'PRESUPUESTO',
  }

  return (
    <div className="rounded-lg border bg-white p-6 text-black shadow-lg max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-4 mb-4">
        <div>
          <p className="text-lg font-bold">{empresaRazonSocial}</p>
          <p className="text-sm">CUIT: {empresaCuit}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{tipoLabel[comprobante.tipo] || comprobante.tipo}</p>
          <p className="text-sm font-mono">
            {String(comprobante.punto_venta?.numero || 0).padStart(5, '0')}-
            {String(comprobante.numero).padStart(8, '0')}
          </p>
        </div>
      </div>

      {/* Datos del comprobante */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p><strong>Fecha:</strong> {formatDate(comprobante.fecha)}</p>
          <p><strong>CUIT/DNI:</strong> {comprobante.identificacion_fiscal}</p>
        </div>
        <div className="text-right">
          <p><strong>Razón Social:</strong> {comprobante.razon_social}</p>
          <p><strong>Condición IVA:</strong> {comprobante.tipo_iva}</p>
        </div>
      </div>

      {/* Items */}
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b">
            <th className="py-2 text-left">Descripción</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">P. Unit.</th>
            <th className="py-2 text-right">IVA</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {comprobante.items?.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.descripcion}</td>
              <td className="py-2 text-right">{item.cantidad}</td>
              <td className="py-2 text-right">{formatCurrency(item.precio_unitario)}</td>
              <td className="py-2 text-right">{item.alicuota_iva}%</td>
              <td className="py-2 text-right">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Neto Gravado:</span>
          <span>{formatCurrency(comprobante.neto_gravado)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA:</span>
          <span>{formatCurrency(comprobante.iva)}</span>
        </div>
        {comprobante.exento > 0 && (
          <div className="flex justify-between">
            <span>Exento:</span>
            <span>{formatCurrency(comprobante.exento)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-1 text-lg font-bold">
          <span>TOTAL:</span>
          <span>{formatCurrency(comprobante.total)}</span>
        </div>
      </div>

      {/* CAE */}
      {comprobante.cae && (
        <div className="mt-4 border-t pt-4 text-sm text-center">
          <p><strong>CAE:</strong> {comprobante.cae}</p>
          <p><strong>Vto. CAE:</strong> {comprobante.fecha_vto_cae}</p>
        </div>
      )}

      {/* Notas */}
      {comprobante.notas && (
        <div className="mt-4 border-t pt-4 text-sm">
          <p className="text-muted-foreground">{comprobante.notas}</p>
        </div>
      )}
    </div>
  )
}

import { z } from 'zod'

export const createPuntoVentaSchema = z.object({
  empresa_id: z.string().uuid(),
  numero: z.number().int().min(1, 'El número es requerido'),
  tipo_comprobante: z.enum(['factura_a', 'factura_b', 'factura_c', 'nota_credito', 'nota_debito', 'presupuesto']),
})

export const itemComprobanteSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  precio_unitario: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  alicuota_iva: z.number().min(0).max(100),
})

export const createComprobanteSchema = z.object({
  empresa_id: z.string().uuid(),
  tipo: z.enum(['factura_a', 'factura_b', 'factura_c', 'nota_credito', 'nota_debito', 'presupuesto']),
  operacion: z.enum(['venta', 'compra']),
  punto_venta_id: z.string().uuid('Seleccione un punto de venta'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  razon_social: z.string().min(1, 'La razón social es requerida'),
  identificacion_fiscal: z.string().min(1, 'El CUIT/DNI es requerido'),
  tipo_iva: z.string().default('responsable_inscripto'),
  items: z.array(itemComprobanteSchema).min(1, 'Debe agregar al menos un ítem'),
  notas: z.string().optional(),
})

export type CreateComprobanteInput = z.infer<typeof createComprobanteSchema>
export type CreatePuntoVentaInput = z.infer<typeof createPuntoVentaSchema>

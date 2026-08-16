import { z } from 'zod'

export const createRetencionSchema = z.object({
  empresa_id: z.string().uuid(),
  tipo: z.enum(['iva', 'ganancias', 'iibb', 'suss', 'honorarios', 'otros']),
  fecha: z.string().min(1, 'La fecha es requerida'),
  numero: z.string().min(1, 'El número es requerido'),
  tercero_tipo: z.string().default('proveedor'),
  razon_social: z.string().min(1, 'La razón social es requerida'),
  identificacion_fiscal: z.string().min(1, 'El CUIT/DNI es requerido'),
  base_imponible: z.number().min(0, 'La base imponible debe ser mayor a 0'),
  alicuota: z.number().min(0).max(100),
  constancia: z.string().optional(),
  notas: z.string().optional(),
})

export type CreateRetencionInput = z.infer<typeof createRetencionSchema>

export const createPercepcionSchema = z.object({
  empresa_id: z.string().uuid(),
  tipo: z.enum(['iva', 'ganancias', 'iibb', 'suss', 'otros']),
  fecha: z.string().min(1, 'La fecha es requerida'),
  numero: z.string().min(1, 'El número es requerido'),
  tercero_tipo: z.string().default('cliente'),
  razon_social: z.string().min(1, 'La razón social es requerida'),
  identificacion_fiscal: z.string().min(1, 'El CUIT/DNI es requerido'),
  base_imponible: z.number().min(0, 'La base imponible debe ser mayor a 0'),
  alicuota: z.number().min(0).max(100),
  notas: z.string().optional(),
})

export type CreatePercepcionInput = z.infer<typeof createPercepcionSchema>

export const filtroImpuestosSchema = z.object({
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  tipo: z.string().optional(),
})

export type FiltroImpuestos = z.infer<typeof filtroImpuestosSchema>

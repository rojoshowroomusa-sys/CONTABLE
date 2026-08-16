import { z } from 'zod'

export const createTerceroSchema = z.object({
  empresa_id: z.string().uuid(),
  tipo: z.enum(['cliente', 'proveedor']),
  razon_social: z.string().min(1, 'La razón social es requerida'),
  identificacion_fiscal: z.string().min(1, 'El CUIT/DNI es requerido'),
  domicilio: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  condicion_iva: z.string().default('responsable_inscripto'),
})

export type CreateTerceroInput = z.infer<typeof createTerceroSchema>

export const createLetraSchema = z.object({
  empresa_id: z.string().uuid(),
  tercero_id: z.string().uuid(),
  numero: z.string().min(1, 'El número es requerido'),
  fecha_emision: z.string().min(1, 'La fecha de emisión es requerida'),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  tercero_tipo: z.enum(['cliente', 'proveedor']),
}).refine(
  (data) => new Date(data.fecha_vencimiento) > new Date(data.fecha_emision),
  { message: 'La fecha de vencimiento debe ser posterior a la de emisión', path: ['fecha_vencimiento'] }
)

export type CreateLetraInput = z.infer<typeof createLetraSchema>

export const createChequeSchema = z.object({
  empresa_id: z.string().uuid(),
  numero: z.string().min(1, 'El número es requerido'),
  banco: z.string().min(1, 'El banco es requerido'),
  sucursal: z.string().optional(),
  fecha_emision: z.string().min(1, 'La fecha de emisión es requerida'),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  tercero_tipo: z.enum(['cliente', 'proveedor']),
  tercero_id: z.string().uuid(),
})

export type CreateChequeInput = z.infer<typeof createChequeSchema>

import { z } from 'zod'

export const createPlanCuentaSchema = z.object({
  empresa_id: z.string().uuid(),
  codigo_cuenta: z.string().min(1, 'El código es requerido').max(20),
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  tipo: z.enum(['activo', 'pasivo', 'patrimonio', 'ingreso', 'egreso']),
  nivel: z.number().int().min(1),
  padre_id: z.string().uuid().nullable().optional(),
})

export type CreatePlanCuentaInput = z.infer<typeof createPlanCuentaSchema>

export const lineaAsientoSchema = z.object({
  cuenta_id: z.string().uuid('Seleccione una cuenta'),
  debe: z.number().min(0).default(0),
  haber: z.number().min(0).default(0),
}).refine(
  (data) => data.debe > 0 || data.haber > 0,
  { message: 'Debe o Haber debe ser mayor a 0' }
).refine(
  (data) => !(data.debe > 0 && data.haber > 0),
  { message: 'No puede tener debe y haber al mismo tiempo' }
)

export const createAsientoSchema = z.object({
  empresa_id: z.string().uuid(),
  fecha: z.string().min(1, 'La fecha es requerida'),
  concepto: z.string().min(1, 'El concepto es requerido').max(500),
  lineas: z.array(lineaAsientoSchema).min(2, 'Debe tener al menos 2 líneas'),
}).refine(
  (data) => {
    const totalDebe = data.lineas.reduce((sum, l) => sum + l.debe, 0)
    const totalHaber = data.lineas.reduce((sum, l) => sum + l.haber, 0)
    return totalDebe === totalHaber
  },
  { message: 'El asiento debe estar balanceado (debe = haber)', path: ['lineas'] }
)

export type CreateAsientoInput = z.infer<typeof createAsientoSchema>

export const createPeriodoSchema = z.object({
  empresa_id: z.string().uuid(),
  nombre: z.string().min(1, 'El nombre es requerido').max(50),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
}).refine(
  (data) => new Date(data.fecha_fin) > new Date(data.fecha_inicio),
  { message: 'La fecha de fin debe ser posterior a la fecha de inicio', path: ['fecha_fin'] }
)

export type CreatePeriodoInput = z.infer<typeof createPeriodoSchema>

export const filtroAsientosSchema = z.object({
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  estado: z.enum(['borrador', 'asentado']).optional(),
  cuenta_id: z.string().uuid().optional(),
  buscar: z.string().optional(),
})

export type FiltroAsientos = z.infer<typeof filtroAsientosSchema>

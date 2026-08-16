export type TipoCuenta = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'egreso'
export type EstadoAsiento = 'borrador' | 'asentado'
export type EstadoPeriodo = 'abierto' | 'cerrado'

export interface PlanCuenta {
  id: string
  empresa_id: string
  codigo_cuenta: string
  nombre: string
  tipo: TipoCuenta
  nivel: number
  padre_id: string | null
  created_at: string
  updated_at: string
  children?: PlanCuenta[]
}

export interface AsientoContable {
  id: string
  empresa_id: string
  fecha: string
  concepto: string
  estado: EstadoAsiento
  created_at: string
  updated_at: string
  lineas?: LineaAsiento[]
}

export interface LineaAsiento {
  id: string
  asiento_id: string
  cuenta_id: string
  debe: number
  haber: number
  created_at: string
  cuenta?: PlanCuenta
}

export interface PeriodoContable {
  id: string
  empresa_id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  estado: EstadoPeriodo
  created_at: string
  updated_at: string
}

export interface CreatePlanCuentaInput {
  empresa_id: string
  codigo_cuenta: string
  nombre: string
  tipo: TipoCuenta
  nivel: number
  padre_id?: string | null
}

export interface CreateAsientoInput {
  empresa_id: string
  fecha: string
  concepto: string
  lineas: {
    cuenta_id: string
    debe: number
    haber: number
  }[]
}

export interface UpdateAsientoInput {
  fecha?: string
  concepto?: string
  estado?: EstadoAsiento
  lineas?: {
    id?: string
    cuenta_id: string
    debe: number
    haber: number
  }[]
}

export interface CreatePeriodoInput {
  empresa_id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

export interface BalanceCuenta {
  cuenta_id: string
  codigo_cuenta: string
  nombre: string
  tipo: TipoCuenta
  total_debe: number
  total_haber: number
  saldo: number
}

export interface FiltroAsientos {
  fecha_desde?: string
  fecha_hasta?: string
  estado?: EstadoAsiento
  cuenta_id?: string
  buscar?: string
}

export type EstadoMovimientoCaja = 'pendiente' | 'confirmado' | 'anulado'
export type EstadoMovimientoBanco = 'pendiente' | 'reconciliado' | 'en_banco'
export type TipoConciliacion = 'deposito' | 'retiro' | 'transferencia' | 'cheque' | 'intereses' | 'comision' | 'otro'

export interface Caja {
  id: string
  empresa_id: string
  nombre: string
  moneda: string
  saldo_inicial: number
  saldo_actual: number
  activa: boolean
  created_at: string
  updated_at: string
}

export interface MovimientoCaja {
  id: string
  caja_id: string
  fecha: string
  tipo: string
  descripcion: string
  comprobante_id: string | null
  monto: number
  saldo_anterior: number
  saldo_posterior: number
  estado: EstadoMovimientoCaja
  tercero_id: string | null
  notas: string | null
  created_at: string
}

export interface CuentaBancaria {
  id: string
  empresa_id: string
  banco: string
  numero_cuenta: string
  tipo_cuenta: string
  moneda: string
  saldo_inicial: number
  saldo_actual: number
  titular: string | null
  cbu: string | null
  activa: boolean
  created_at: string
  updated_at: string
}

export interface MovimientoBanco {
  id: string
  cuenta_bancaria_id: string
  fecha: string
  tipo: TipoConciliacion
  descripcion: string
  comprobante_id: string | null
  monto: number
  saldo_anterior: number
  saldo_posterior: number
  estado: EstadoMovimientoBanco
  cheque_id: string | null
  tercero_id: string | null
  notas: string | null
  created_at: string
}

export interface ConciliacionBancaria {
  id: string
  empresa_id: string
  cuenta_bancaria_id: string
  fecha_inicio: string
  fecha_fin: string
  saldo_contable: number
  saldo_bancario: number
  diferencias: number
  estado: string
  notas: string | null
  created_at: string
  updated_at: string
}

export interface ItemConciliacion {
  id: string
  conciliacion_id: string
  movimientoid: string
  conciliado: boolean
  notas: string | null
  created_at: string
}

export interface CreateCajaInput {
  empresa_id: string
  nombre: string
  moneda?: string
  saldo_inicial?: number
}

export interface CreateMovimientoCajaInput {
  caja_id: string
  fecha: string
  tipo: string
  descripcion: string
  monto: number
  comprobante_id?: string
  tercero_id?: string
}

export interface CreateCuentaBancariaInput {
  empresa_id: string
  banco: string
  numero_cuenta: string
  tipo_cuenta?: string
  moneda?: string
  saldo_inicial?: number
  titular?: string
  cbu?: string
}

export interface CreateMovimientoBancoInput {
  cuenta_bancaria_id: string
  fecha: string
  tipo: TipoConciliacion
  descripcion: string
  monto: number
  comprobante_id?: string
  cheque_id?: string
  tercero_id?: string
}

export interface ResumenCaja {
  caja_id: string
  nombre: string
  saldo_actual: number
  ingresos_periodo: number
  egresos_periodo: number
  movimientos_pendientes: number
}

export interface ResumenBanco {
  cuenta_id: string
  banco: string
  numero_cuenta: string
  saldo_actual: number
  movimientos_no_reconciliados: number
}

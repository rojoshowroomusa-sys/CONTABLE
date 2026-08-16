export type TerceroTipo = 'cliente' | 'proveedor'
export type EstadoLetra = 'pendiente' | 'aceptada' | 'vencida' | 'pagada' | 'protestada'
export type EstadoCheque = 'pendiente' | 'cobrado' | 'rechazado' | 'depositado' | 'endosado'

export interface Tercero {
  id: string
  empresa_id: string
  tipo: TerceroTipo
  razon_social: string
  identificacion_fiscal: string
  domicilio: string | null
  telefono: string | null
  email: string | null
  condicion_iva: string
  saldo: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CuentaCorriente {
  id: string
  empresa_id: string
  tercero_id: string
  saldo: number
  created_at: string
  updated_at: string
  tercero?: Tercero
}

export interface MovimientoCC {
  id: string
  cuenta_corriente_id: string
  fecha: string
  tipo: string
  descripcion: string
  comprobante_id: string | null
  debito: number
  credito: number
  saldo: number
  created_at: string
}

export interface Letra {
  id: string
  empresa_id: string
  tercero_id: string
  numero: string
  fecha_emision: string
  fecha_vencimiento: string
  monto: number
  moneda: string
  estado: EstadoLetra
  tercero_tipo: TerceroTipo
  notas: string | null
  created_at: string
  updated_at: string
  tercero?: Tercero
}

export interface Cheque {
  id: string
  empresa_id: string
  numero: string
  banco: string
  sucursal: string | null
  fecha_emision: string
  fecha_vencimiento: string
  monto: number
  tercero_tipo: TerceroTipo
  tercero_id: string
  estado: EstadoCheque
  cuenta_corriente_id: string | null
  notas: string | null
  created_at: string
  updated_at: string
  tercero?: Tercero
}

export interface AgingItem {
  tercero_id: string
  razon_social: string
  saldo_total: number
  corriente: number
  vencido_30: number
  vencido_60: number
  vencido_90: number
}

export interface CreateTerceroInput {
  empresa_id: string
  tipo: TerceroTipo
  razon_social: string
  identificacion_fiscal: string
  domicilio?: string
  telefono?: string
  email?: string
  condicion_iva?: string
}

export interface CreateLetraInput {
  empresa_id: string
  tercero_id: string
  numero: string
  fecha_emision: string
  fecha_vencimiento: string
  monto: number
  tercero_tipo: TerceroTipo
}

export interface CreateChequeInput {
  empresa_id: string
  numero: string
  banco: string
  sucursal?: string
  fecha_emision: string
  fecha_vencimiento: string
  monto: number
  tercero_tipo: TerceroTipo
  tercero_id: string
}

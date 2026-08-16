export type EstadoConvenio = 'vigente' | 'vencido' | 'suspendido'
export type TipoProducto = 'producto' | 'servicio' | 'materia_prima'
export type TipoMovimientoStock = 'ingreso' | 'egreso' | 'transferencia' | 'ajuste'

export interface ConvenioMultilateral {
  id: string
  empresa_id: string
  numero: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  estado: EstadoConvenio
  porcentaje_retencion: number
  jurisdiccion: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface RetencionMultilateral {
  id: string
  convenio_id: string
  comprobante_id: string | null
  fecha: string
  base_imponible: number
  porcentaje: number
  monto_retenido: number
  certificado: string | null
  notas: string | null
  created_at: string
}

export interface Producto {
  id: string
  empresa_id: string
  codigo: string
  descripcion: string
  tipo: TipoProducto
  precio_compra: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  unidad_medida: string
  alicuota_iva: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface MovimientoStock {
  id: string
  empresa_id: string
  producto_id: string
  fecha: string
  tipo: TipoMovimientoStock
  cantidad: number
  precio_unitario: number
  total: number
  comprobante_id: string | null
  notas: string | null
  created_at: string
  producto?: Producto
}

export interface Empleado {
  id: string
  empresa_id: string
  legajo: string
  nombre: string
  cuil: string
  fecha_ingreso: string
  fecha_egreso: string | null
  puesto: string | null
  sector: string | null
  salario_base: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ConceptoRRHH {
  id: string
  empresa_id: string
  codigo: string
  nombre: string
  tipo: string
  remunerativo: boolean
  porcentaje: number | null
  monto_fijo: number | null
  created_at: string
}

export interface LegajoEmpleado {
  id: string
  empleado_id: string
  concepto_id: string
  fecha_desde: string
  fecha_hasta: string | null
  monto: number
  porcentaje: number | null
  activo: boolean
  created_at: string
}

export interface CreateConvenioInput {
  empresa_id: string
  numero: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  porcentaje_retencion: number
  jurisdiccion?: string
}

export interface CreateProductoInput {
  empresa_id: string
  codigo: string
  descripcion: string
  tipo?: TipoProducto
  precio_compra?: number
  precio_venta?: number
  stock_minimo?: number
  unidad_medida?: string
  alicuota_iva?: number
}

export interface CreateMovimientoStockInput {
  empresa_id: string
  producto_id: string
  fecha: string
  tipo: TipoMovimientoStock
  cantidad: number
  precio_unitario: number
  notas?: string
}

export interface CreateEmpleadoInput {
  empresa_id: string
  legajo: string
  nombre: string
  cuil: string
  fecha_ingreso: string
  puesto?: string
  sector?: string
  salario_base?: number
}

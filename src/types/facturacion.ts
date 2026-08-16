export type TipoComprobante = 'factura_a' | 'factura_b' | 'factura_c' | 'nota_credito' | 'nota_debito' | 'presupuesto'
export type TipoOperacion = 'venta' | 'compra'
export type EstadoComprobante = 'borrador' | 'emitido' | 'cancelado' | 'anulado'

export interface PuntoVenta {
  id: string
  empresa_id: string
  numero: number
  tipo_comprobante: TipoComprobante
  ultimo_numero: number
  created_at: string
}

export interface ComprobanteFiscal {
  id: string
  empresa_id: string
  tipo: TipoComprobante
  operacion: TipoOperacion
  punto_venta_id: string
  numero: number
  fecha: string
  cliente_proveedor_id: string | null
  razon_social: string
  identificacion_fiscal: string
  tipo_iva: string
  neto_gravado: number
  iva: number
  exento: number
  no_gravado: number
  total: number
  estado: EstadoComprobante
  cae: string | null
  fecha_vto_cae: string | null
  comprobante_original_id: string | null
  asiento_id: string | null
  notas: string | null
  created_at: string
  updated_at: string
  items?: ItemComprobante[]
  punto_venta?: PuntoVenta
}

export interface ItemComprobante {
  id: string
  comprobante_id: string
  orden: number
  descripcion: string
  cantidad: number
  precio_unitario: number
  alicuota_iva: number
  subtotal: number
  created_at: string
}

export interface AlicuotaIVA {
  id: string
  empresa_id: string
  porcentaje: number
  descripcion: string
  activa: boolean
  created_at: string
}

export interface CreateComprobanteInput {
  empresa_id: string
  tipo: TipoComprobante
  operacion: TipoOperacion
  punto_venta_id: string
  fecha: string
  razon_social: string
  identificacion_fiscal: string
  tipo_iva?: string
  items: {
    descripcion: string
    cantidad: number
    precio_unitario: number
    alicuota_iva: number
  }[]
  notas?: string
}

export interface CreatePuntoVentaInput {
  empresa_id: string
  numero: number
  tipo_comprobante: TipoComprobante
}

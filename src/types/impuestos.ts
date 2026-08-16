export type TipoRetencion = 'iva' | 'ganancias' | 'iibb' | 'suss' | 'honorarios' | 'otros'
export type TipoPercepcion = 'iva' | 'ganancias' | 'iibb' | 'suss' | 'otros'

export interface Retencion {
  id: string
  empresa_id: string
  tipo: TipoRetencion
  fecha: string
  numero: string
  tercero_tipo: string
  tercero_id: string | null
  razon_social: string
  identificacion_fiscal: string
  base_imponible: number
  alicuota: number
  monto: number
  constancia: string | null
  comprobante_original_id: string | null
  asiento_id: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Percepcion {
  id: string
  empresa_id: string
  tipo: TipoPercepcion
  fecha: string
  numero: string
  tercero_tipo: string
  tercero_id: string | null
  razon_social: string
  identificacion_fiscal: string
  base_imponible: number
  alicuota: number
  monto: number
  comprobante_original_id: string | null
  asiento_id: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface LibroIVAMensual {
  mes: number
  anio: number
 总Ventas: number
 总Compras: number
  ivaVentas: number
  ivaCompras: number
  ivaDebitoFiscal: number
  ivaCreditoFiscal: number
  saldoIVA: number
}

export interface ResumenImpuestos {
  ivaDebitoFiscal: number
  ivaCreditoFiscal: number
  saldoIVA: number
  retenciones: {
    tipo: string
    monto: number
  }[]
  percepciones: {
    tipo: string
    monto: number
  }[]
  totalRetenciones: number
  totalPercepciones: number
}

export interface CreateRetencionInput {
  empresa_id: string
  tipo: TipoRetencion
  fecha: string
  numero: string
  tercero_tipo: string
  razon_social: string
  identificacion_fiscal: string
  base_imponible: number
  alicuota: number
  constancia?: string
  notas?: string
}

export interface CreatePercepcionInput {
  empresa_id: string
  tipo: TipoPercepcion
  fecha: string
  numero: string
  tercero_tipo: string
  razon_social: string
  identificacion_fiscal: string
  base_imponible: number
  alicuota: number
  notas?: string
}

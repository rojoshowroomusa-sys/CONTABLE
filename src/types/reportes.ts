export interface LineaBalance {
  cuenta_codigo: string
  cuenta_nombre: string
  saldo_deudor: number
  saldo_acreedor: number
  nivel: number
}

export interface BalanceGeneral {
  activo: LineaBalance[]
  pasivo: LineaBalance[]
  patrimonio: LineaBalance[]
  total_activo: number
  total_pasivo: number
  total_patrimonio: number
}

export interface LineaResultado {
  cuenta_codigo: string
  cuenta_nombre: string
  monto: number
  nivel: number
}

export interface EstadoResultados {
  ingresos_operativos: LineaResultado[]
  egresos_operativos: LineaResultado[]
  otros_ingresos: LineaResultado[]
  otros_egresos: LineaResultado[]
  resultado_operativo: number
  resultado_antes_impuestos: number
  impuestos: number
  resultado_neto: number
}

export interface LineaFlujoCaja {
  concepto: string
  monto: number
  categoria: 'operacion' | 'inversion' | 'financiamiento'
  nivel: number
}

export interface FlujoCaja {
  operacion: LineaFlujoCaja[]
  inversion: LineaFlujoCaja[]
  financiamiento: LineaFlujoCaja[]
  total_operacion: number
  total_inversion: number
  total_financiamiento: number
  flujo_neto: number
  saldo_inicial: number
  saldo_final: number
}

export interface ParametrosReporte {
  empresa_id: string
  fecha_desde: string
  fecha_hasta: string
  periodo_id?: string
}

export interface ResumenCuenta {
  codigo: string
  nombre: string
  debe: number
  haber: number
  saldo: number
}

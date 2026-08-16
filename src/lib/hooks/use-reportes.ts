'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  BalanceGeneral,
  EstadoResultados,
  FlujoCaja,
  ParametrosReporte,
  LineaBalance,
  LineaResultado,
  LineaFlujoCaja,
  ResumenCuenta,
} from '@/types/reportes'

export function useReportes() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCuentasConSaldo = async (empresaId: string): Promise<ResumenCuenta[]> => {
    const { data: cuentas, error: errCuentas } = await supabase
      .from('plan_cuentas')
      .select('id, codigo_cuenta, nombre, tipo, nivel')
      .eq('empresa_id', empresaId)
      .order('codigo_cuenta')

    if (errCuentas) { setError(errCuentas.message); return [] }

    const { data: lineas, error: errLineas } = await supabase
      .from('lineas_asiento')
      .select('cuenta_id, debe, haber')
      .in('cuenta_id', (cuentas || []).map((c) => c.id))

    if (errLineas) { setError(errLineas.message); return [] }

    const saldos = new Map<string, { debe: number; haber: number }>()
    for (const linea of lineas || []) {
      const prev = saldos.get(linea.cuenta_id) || { debe: 0, haber: 0 }
      prev.debe += Number(linea.debe)
      prev.haber += Number(linea.haber)
      saldos.set(linea.cuenta_id, prev)
    }

    return (cuentas || []).map((c) => {
      const saldo = saldos.get(c.id) || { debe: 0, haber: 0 }
      return {
        codigo: c.codigo_cuenta,
        nombre: c.nombre,
        debe: saldo.debe,
        haber: saldo.haber,
        saldo: saldo.debe - saldo.haber,
      }
    })
  }

  const fetchBalanceGeneral = useCallback(async (params: ParametrosReporte): Promise<BalanceGeneral> => {
    setLoading(true)
    const cuentas = await fetchCuentasConSaldo(params.empresa_id)

    const getCuentasByRango = (inicio: string, fin: string): LineaBalance[] => {
      return cuentas
        .filter((c) => c.codigo >= inicio && c.codigo <= fin && c.saldo !== 0)
        .map((c) => ({
          cuenta_codigo: c.codigo,
          cuenta_nombre: c.nombre,
          saldo_deudor: c.saldo > 0 ? c.saldo : 0,
          saldo_acreedor: c.saldo < 0 ? Math.abs(c.saldo) : 0,
          nivel: c.codigo.split('.').length - 1,
        }))
    }

    const activo = getCuentasByRango('1', '1.99')
    const pasivo = getCuentasByRango('2', '2.99')
    const patrimonio = getCuentasByRango('3', '3.99')

    const totalActivo = activo.reduce((sum, l) => sum + l.saldo_deudor - l.saldo_acreedor, 0)
    const totalPasivo = pasivo.reduce((sum, l) => sum + l.saldo_acreedor - l.saldo_deudor, 0)
    const totalPatrimonio = patrimonio.reduce((sum, l) => sum + l.saldo_acreedor - l.saldo_deudor, 0)

    setLoading(false)
    return {
      activo,
      pasivo,
      patrimonio,
      total_activo: totalActivo,
      total_pasivo: totalPasivo,
      total_patrimonio: totalPatrimonio,
    }
  }, [supabase])

  const fetchEstadoResultados = useCallback(async (params: ParametrosReporte): Promise<EstadoResultados> => {
    setLoading(true)
    const cuentas = await fetchCuentasConSaldo(params.empresa_id)

    const getCuentasByRango = (inicio: string, fin: string): LineaResultado[] => {
      return cuentas
        .filter((c) => c.codigo >= inicio && c.codigo <= fin && c.saldo !== 0)
        .map((c) => ({
          cuenta_codigo: c.codigo,
          cuenta_nombre: c.nombre,
          monto: c.saldo,
          nivel: c.codigo.split('.').length - 1,
        }))
    }

    const ingresos = getCuentasByRango('4.01', '4.04')
    const egresos = getCuentasByRango('5.01', '5.05')
    const otrosIngresos = getCuentasByRango('4.05', '4.99')
    const otrosEgresos = getCuentasByRango('5.06', '5.99')

    const totalIngresos = [...ingresos, ...otrosIngresos].reduce((sum, l) => sum + Math.abs(l.monto), 0)
    const totalEgresos = [...egresos, ...otrosEgresos].reduce((sum, l) => sum + Math.abs(l.monto), 0)
    const resultadoOperativo = totalIngresos - totalEgresos
    const impuestos = cuentas.filter((c) => c.codigo.startsWith('6.')).reduce((sum, c) => sum + Math.abs(c.saldo), 0)
    const resultadoNeto = resultadoOperativo - impuestos

    setLoading(false)
    return {
      ingresos_operativos: ingresos,
      egresos_operativos: egresos,
      otros_ingresos: otrosIngresos,
      otros_egresos: otrosEgresos,
      resultado_operativo: resultadoOperativo,
      resultado_antes_impuestos: resultadoOperativo,
      impuestos,
      resultado_neto: resultadoNeto,
    }
  }, [supabase])

  const fetchFlujoCaja = useCallback(async (params: ParametrosReporte): Promise<FlujoCaja> => {
    setLoading(true)
    const cuentas = await fetchCuentasConSaldo(params.empresa_id)

    const operacion: LineaFlujoCaja[] = [
      { concepto: 'Cobros a clientes', monto: 0, categoria: 'operacion', nivel: 0 },
      { concepto: 'Pagos a proveedores', monto: 0, categoria: 'operacion', nivel: 0 },
      { concepto: 'Pago de sueldos', monto: 0, categoria: 'operacion', nivel: 0 },
      { concepto: 'Pago de impuestos', monto: 0, categoria: 'operacion', nivel: 0 },
    ]

    const inversion: LineaFlujoCaja[] = [
      { concepto: 'Compra de activos fijos', monto: 0, categoria: 'inversion', nivel: 0 },
      { concepto: 'Inversiones', monto: 0, categoria: 'inversion', nivel: 0 },
    ]

    const financiamiento: LineaFlujoCaja[] = [
      { concepto: 'Préstamos obtenidos', monto: 0, categoria: 'financiamiento', nivel: 0 },
      { concepto: 'Pago de préstamos', monto: 0, categoria: 'financiamiento', nivel: 0 },
    ]

    const totalOp = operacion.reduce((sum, l) => sum + l.monto, 0)
    const totalInv = inversion.reduce((sum, l) => sum + l.monto, 0)
    const totalFin = financiamiento.reduce((sum, l) => sum + l.monto, 0)

    setLoading(false)
    return {
      operacion,
      inversion,
      financiamiento,
      total_operacion: totalOp,
      total_inversion: totalInv,
      total_financiamiento: totalFin,
      flujo_neto: totalOp + totalInv + totalFin,
      saldo_inicial: 0,
      saldo_final: 0,
    }
  }, [supabase])

  return {
    loading,
    error,
    fetchBalanceGeneral,
    fetchEstadoResultados,
    fetchFlujoCaja,
    fetchCuentasConSaldo,
  }
}

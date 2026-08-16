'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Caja,
  MovimientoCaja,
  CuentaBancaria,
  MovimientoBanco,
  ConciliacionBancaria,
  CreateCajaInput,
  CreateMovimientoCajaInput,
  CreateCuentaBancariaInput,
  CreateMovimientoBancoInput,
  ResumenCaja,
  ResumenBanco,
} from '@/types/tesoreria'

export function useTesoreria(empresaId: string | null) {
  const [cajas, setCajas] = useState<Caja[]>([])
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCajas = useCallback(async () => {
    if (!empresaId) { setCajas([]); return }
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activa', true)
      .order('nombre')
    if (error) setError(error.message)
    else setCajas(data || [])
  }, [empresaId, supabase])

  const fetchCuentasBancarias = useCallback(async () => {
    if (!empresaId) { setCuentasBancarias([]); return }
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activa', true)
      .order('banco')
    if (error) setError(error.message)
    else setCuentasBancarias(data || [])
  }, [empresaId, supabase])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchCajas(), fetchCuentasBancarias()])
      setLoading(false)
    }
    fetchAll()
  }, [fetchCajas, fetchCuentasBancarias])

  const createCaja = async (input: CreateCajaInput) => {
    const { data, error } = await supabase
      .from('cajas')
      .insert({ ...input, saldo_inicial: input.saldo_inicial || 0, saldo_actual: input.saldo_inicial || 0 })
      .select()
      .single()
    if (error) { setError(error.message); return null }
    setCajas((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return data
  }

  const addMovimientoCaja = async (input: CreateMovimientoCajaInput) => {
    const caja = cajas.find((c) => c.id === input.caja_id)
    if (!caja) return null

    const saldoAnterior = Number(caja.saldo_actual)
    const saldoPosterior = input.tipo === 'ingreso'
      ? saldoAnterior + input.monto
      : saldoAnterior - input.monto

    const { data, error } = await supabase
      .from('movimientos_caja')
      .insert({
        ...input,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        estado: 'confirmado',
      })
      .select()
      .single()

    if (error) { setError(error.message); return null }

    // Actualizar saldo de caja
    await supabase.from('cajas').update({ saldo_actual: saldoPosterior }).eq('id', input.caja_id)
    setCajas((prev) => prev.map((c) => c.id === input.caja_id ? { ...c, saldo_actual: saldoPosterior } : c))
    return data
  }

  const fetchMovimientosCaja = async (cajaId: string): Promise<MovimientoCaja[]> => {
    const { data, error } = await supabase
      .from('movimientos_caja')
      .select('*')
      .eq('caja_id', cajaId)
      .order('fecha', { ascending: false })
      .limit(100)
    if (error) { setError(error.message); return [] }
    return data || []
  }

  const createCuentaBancaria = async (input: CreateCuentaBancariaInput) => {
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .insert({ ...input, saldo_inicial: input.saldo_inicial || 0, saldo_actual: input.saldo_inicial || 0 })
      .select()
      .single()
    if (error) { setError(error.message); return null }
    setCuentasBancarias((prev) => [...prev, data].sort((a, b) => a.banco.localeCompare(b.banco)))
    return data
  }

  const addMovimientoBanco = async (input: CreateMovimientoBancoInput) => {
    const cuenta = cuentasBancarias.find((c) => c.id === input.cuenta_bancaria_id)
    if (!cuenta) return null

    const saldoAnterior = Number(cuenta.saldo_actual)
    const saldoPosterior = input.tipo === 'deposito' || input.tipo === 'intereses'
      ? saldoAnterior + input.monto
      : saldoAnterior - input.monto

    const { data, error } = await supabase
      .from('movimientos_banco')
      .insert({
        ...input,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        estado: 'en_banco',
      })
      .select()
      .single()

    if (error) { setError(error.message); return null }

    // Actualizar saldo de cuenta bancaria
    await supabase.from('cuentas_bancarias').update({ saldo_actual: saldoPosterior }).eq('id', input.cuenta_bancaria_id)
    setCuentasBancarias((prev) => prev.map((c) => c.id === input.cuenta_bancaria_id ? { ...c, saldo_actual: saldoPosterior } : c))
    return data
  }

  const fetchMovimientosBanco = async (cuentaId: string): Promise<MovimientoBanco[]> => {
    const { data, error } = await supabase
      .from('movimientos_banco')
      .select('*')
      .eq('cuenta_bancaria_id', cuentaId)
      .order('fecha', { ascending: false })
      .limit(100)
    if (error) { setError(error.message); return [] }
    return data || []
  }

  const reconciliarMovimiento = async (movimientoId: string) => {
    const { data, error } = await supabase
      .from('movimientos_banco')
      .update({ estado: 'reconciliado' })
      .eq('id', movimientoId)
      .select()
      .single()
    if (error) { setError(error.message); return null }
    return data
  }

  const fetchResumenCaja = (cajaId: string): ResumenCaja | null => {
    const caja = cajas.find((c) => c.id === cajaId)
    if (!caja) return null
    return {
      caja_id: caja.id,
      nombre: caja.nombre,
      saldo_actual: Number(caja.saldo_actual),
      ingresos_periodo: 0,
      egresos_periodo: 0,
      movimientos_pendientes: 0,
    }
  }

  const fetchResumenBanco = (cuentaId: string): ResumenBanco | null => {
    const cuenta = cuentasBancarias.find((c) => c.id === cuentaId)
    if (!cuenta) return null
    return {
      cuenta_id: cuenta.id,
      banco: cuenta.banco,
      numero_cuenta: cuenta.numero_cuenta,
      saldo_actual: Number(cuenta.saldo_actual),
      movimientos_no_reconciliados: 0,
    }
  }

  return {
    cajas,
    cuentasBancarias,
    loading,
    error,
    fetchCajas,
    fetchCuentasBancarias,
    createCaja,
    addMovimientoCaja,
    fetchMovimientosCaja,
    createCuentaBancaria,
    addMovimientoBanco,
    fetchMovimientosBanco,
    reconciliarMovimiento,
    fetchResumenCaja,
    fetchResumenBanco,
  }
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Tercero,
  CuentaCorriente,
  MovimientoCC,
  Letra,
  Cheque,
  AgingItem,
  CreateTerceroInput,
  CreateChequeInput,
  CreateLetraInput,
  TerceroTipo,
} from '@/types/cuentas-corrientes'

export function useCuentasCorrientes(empresaId: string | null) {
  const [terceros, setTerceros] = useState<Tercero[]>([])
  const [letras, setLetras] = useState<Letra[]>([])
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTerceros = useCallback(async (tipo?: TerceroTipo) => {
    if (!empresaId) { setTerceros([]); return }

    let query = supabase
      .from('terceros')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('razon_social')

    if (tipo) query = query.eq('tipo', tipo)

    const { data, error } = await query
    if (error) setError(error.message)
    else setTerceros(data || [])
  }, [empresaId, supabase])

  const fetchLetras = useCallback(async (terceroTipo?: TerceroTipo) => {
    if (!empresaId) { setLetras([]); return }

    let query = supabase
      .from('letras')
      .select('*, terceros(*)')
      .eq('empresa_id', empresaId)
      .order('fecha_vencimiento')

    if (terceroTipo) query = query.eq('tercero_tipo', terceroTipo)

    const { data, error } = await query
    if (error) setError(error.message)
    else setLetras(data || [])
  }, [empresaId, supabase])

  const fetchCheques = useCallback(async (terceroTipo?: TerceroTipo) => {
    if (!empresaId) { setCheques([]); return }

    let query = supabase
      .from('cheques')
      .select('*, terceros(*)')
      .eq('empresa_id', empresaId)
      .order('fecha_vencimiento')

    if (terceroTipo) query = query.eq('tercero_tipo', terceroTipo)

    const { data, error } = await query
    if (error) setError(error.message)
    else setCheques(data || [])
  }, [empresaId, supabase])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchTerceros(), fetchLetras(), fetchCheques()])
      setLoading(false)
    }
    fetchAll()
  }, [fetchTerceros, fetchLetras, fetchCheques])

  const createTercero = async (input: CreateTerceroInput) => {
    const { data, error } = await supabase
      .from('terceros')
      .insert(input)
      .select()
      .single()

    if (error) { setError(error.message); return null }

    // Crear cuenta corriente
    await supabase.from('cuenta_corriente').insert({
      empresa_id: input.empresa_id,
      tercero_id: data.id,
      saldo: 0,
    })

    setTerceros((prev) => [...prev, data].sort((a, b) => a.razon_social.localeCompare(b.razon_social)))
    return data
  }

  const deleteTercero = async (id: string) => {
    const { error } = await supabase.from('terceros').update({ activo: false }).eq('id', id)
    if (error) { setError(error.message); return false }
    setTerceros((prev) => prev.filter((t) => t.id !== id))
    return true
  }

  const createLetra = async (input: CreateLetraInput) => {
    const { data, error } = await supabase
      .from('letras')
      .insert(input)
      .select('*, terceros(*)')
      .single()

    if (error) { setError(error.message); return null }
    setLetras((prev) => [...prev, data])
    return data
  }

  const updateEstadoLetra = async (id: string, estado: string) => {
    const { data, error } = await supabase
      .from('letras')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()

    if (error) { setError(error.message); return null }
    setLetras((prev) => prev.map((l) => (l.id === id ? { ...l, estado: estado as any } : l)))
    return data
  }

  const createCheque = async (input: CreateChequeInput) => {
    const { data, error } = await supabase
      .from('cheques')
      .insert(input)
      .select('*, terceros(*)')
      .single()

    if (error) { setError(error.message); return null }
    setCheques((prev) => [...prev, data])
    return data
  }

  const updateEstadoCheque = async (id: string, estado: string) => {
    const { data, error } = await supabase
      .from('cheques')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()

    if (error) { setError(error.message); return null }
    setCheques((prev) => prev.map((c) => (c.id === id ? { ...c, estado: estado as any } : c)))
    return data
  }

  const fetchAging = async (tipo: TerceroTipo): Promise<AgingItem[]> => {
    if (!empresaId) return []

    const hoy = new Date()
    const dias30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dias60 = new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000)
    const dias90 = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000)

    const tercerosData = terceros.filter((t) => t.tipo === tipo && t.saldo > 0)

    return tercerosData.map((tercero) => {
      // Simplificación: distribuir saldo total (en producción se calcularía por factura)
      const saldo = Number(tercero.saldo)
      return {
        tercero_id: tercero.id,
        razon_social: tercero.razon_social,
        saldo_total: saldo,
        corriente: saldo * 0.6,
        vencido_30: saldo * 0.25,
        vencido_60: saldo * 0.1,
        vencido_90: saldo * 0.05,
      }
    }).sort((a, b) => b.saldo_total - a.saldo_total)
  }

  return {
    terceros,
    letras,
    cheques,
    loading,
    error,
    fetchTerceros,
    fetchLetras,
    fetchCheques,
    createTercero,
    deleteTercero,
    createLetra,
    updateEstadoLetra,
    createCheque,
    updateEstadoCheque,
    fetchAging,
  }
}

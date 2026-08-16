'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AsientoContable, CreateAsientoInput, FiltroAsientos } from '@/types/contabilidad'

export function useAsientos(empresaId: string | null) {
  const [asientos, setAsientos] = useState<AsientoContable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchAsientos = useCallback(async (filtros?: FiltroAsientos) => {
    if (!empresaId) {
      setAsientos([])
      setLoading(false)
      return
    }

    setLoading(true)
    let query = supabase
      .from('asientos_contables')
      .select('*, lineas_asiento(*, plan_cuentas(*))')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })

    if (filtros?.fecha_desde) query = query.gte('fecha', filtros.fecha_desde)
    if (filtros?.fecha_hasta) query = query.lte('fecha', filtros.fecha_hasta)
    if (filtros?.estado) query = query.eq('estado', filtros.estado)

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setAsientos(data || [])
      setError(null)
    }
    setLoading(false)
  }, [empresaId, supabase])

  useEffect(() => {
    fetchAsientos()
  }, [fetchAsientos])

  const createAsiento = async (input: CreateAsientoInput) => {
    const { lineas, ...asientoData } = input

    // Crear asiento
    const { data: asiento, error: asientoError } = await supabase
      .from('asientos_contables')
      .insert(asientoData)
      .select()
      .single()

    if (asientoError) {
      setError(asientoError.message)
      return null
    }

    // Crear líneas
    const lineasData = lineas.map((l) => ({
      ...l,
      asiento_id: asiento.id,
    }))

    const { error: lineasError } = await supabase
      .from('lineas_asiento')
      .insert(lineasData)

    if (lineasError) {
      await supabase.from('asientos_contables').delete().eq('id', asiento.id)
      setError(lineasError.message)
      return null
    }

    // Fetch completo
    const { data: completo } = await supabase
      .from('asientos_contables')
      .select('*, lineas_asiento(*, plan_cuentas(*))')
      .eq('id', asiento.id)
      .single()

    if (completo) {
      setAsientos((prev) => [completo, ...prev])
    }
    return completo
  }

  const asentarAsiento = async (id: string) => {
    const { data, error } = await supabase
      .from('asientos_contables')
      .update({ estado: 'asentado' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    setAsientos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: 'asentado' } : a))
    )
    return data
  }

  const deleteAsiento = async (id: string) => {
    const { error } = await supabase.from('asientos_contables').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return false
    }

    setAsientos((prev) => prev.filter((a) => a.id !== id))
    return true
  }

  return {
    asientos,
    loading,
    error,
    fetchAsientos,
    createAsiento,
    asentarAsiento,
    deleteAsiento,
  }
}

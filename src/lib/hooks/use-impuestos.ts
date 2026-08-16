'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Retencion, Percepcion, ResumenImpuestos, CreateRetencionInput, CreatePercepcionInput } from '@/types/impuestos'

export function useImpuestos(empresaId: string | null) {
  const [retenciones, setRetenciones] = useState<Retencion[]>([])
  const [percepciones, setPercepciones] = useState<Percepcion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchRetenciones = useCallback(async (fechaDesde?: string, fechaHasta?: string) => {
    if (!empresaId) { setRetenciones([]); return }

    let query = supabase
      .from('retenciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })

    if (fechaDesde) query = query.gte('fecha', fechaDesde)
    if (fechaHasta) query = query.lte('fecha', fechaHasta)

    const { data, error } = await query
    if (error) setError(error.message)
    else setRetenciones(data || [])
  }, [empresaId, supabase])

  const fetchPercepciones = useCallback(async (fechaDesde?: string, fechaHasta?: string) => {
    if (!empresaId) { setPercepciones([]); return }

    let query = supabase
      .from('percepciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })

    if (fechaDesde) query = query.gte('fecha', fechaDesde)
    if (fechaHasta) query = query.lte('fecha', fechaHasta)

    const { data, error } = await query
    if (error) setError(error.message)
    else setPercepciones(data || [])
  }, [empresaId, supabase])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchRetenciones(), fetchPercepciones()])
      setLoading(false)
    }
    fetchAll()
  }, [fetchRetenciones, fetchPercepciones])

  const createRetencion = async (input: CreateRetencionInput) => {
    const monto = input.base_imponible * (input.alicuota / 100)
    const { data, error } = await supabase
      .from('retenciones')
      .insert({ ...input, monto })
      .select()
      .single()

    if (error) { setError(error.message); return null }
    setRetenciones((prev) => [data, ...prev])
    return data
  }

  const deleteRetencion = async (id: string) => {
    const { error } = await supabase.from('retenciones').delete().eq('id', id)
    if (error) { setError(error.message); return false }
    setRetenciones((prev) => prev.filter((r) => r.id !== id))
    return true
  }

  const createPercepcion = async (input: CreatePercepcionInput) => {
    const monto = input.base_imponible * (input.alicuota / 100)
    const { data, error } = await supabase
      .from('percepciones')
      .insert({ ...input, monto })
      .select()
      .single()

    if (error) { setError(error.message); return null }
    setPercepciones((prev) => [data, ...prev])
    return data
  }

  const deletePercepcion = async (id: string) => {
    const { error } = await supabase.from('percepciones').delete().eq('id', id)
    if (error) { setError(error.message); return false }
    setPercepciones((prev) => prev.filter((p) => p.id !== id))
    return true
  }

  const fetchResumen = async (fechaDesde?: string, fechaHasta?: string): Promise<ResumenImpuestos | null> => {
    if (!empresaId) return null

    // IVA Débito Fiscal (ventas)
    let ventasQuery = supabase
      .from('comprobantes_fiscales')
      .select('iva, tipo')
      .eq('empresa_id', empresaId)
      .eq('operacion', 'venta')
      .eq('estado', 'emitido')

    if (fechaDesde) ventasQuery = ventasQuery.gte('fecha', fechaDesde)
    if (fechaHasta) ventasQuery = ventasQuery.lte('fecha', fechaHasta)

    const { data: ventas } = await ventasQuery

    // IVA Crédito Fiscal (compras)
    let comprasQuery = supabase
      .from('comprobantes_fiscales')
      .select('iva, tipo')
      .eq('empresa_id', empresaId)
      .eq('operacion', 'compra')
      .eq('estado', 'emitido')

    if (fechaDesde) comprasQuery = comprasQuery.gte('fecha', fechaDesde)
    if (fechaHasta) comprasQuery = comprasQuery.lte('fecha', fechaHasta)

    const { data: compras } = await comprasQuery

    const ivaDebitoFiscal = (ventas || [])
      .filter((v) => v.tipo === 'factura_a' || v.tipo === 'factura_b')
      .reduce((sum, v) => sum + Number(v.iva), 0)

    const ivaCreditoFiscal = (compras || [])
      .filter((c) => c.tipo === 'factura_a')
      .reduce((sum, c) => sum + Number(c.iva), 0)

    // Retenciones por tipo
    const retencionesPorTipo = retenciones
      .filter((r) => {
        if (fechaDesde && r.fecha < fechaDesde) return false
        if (fechaHasta && r.fecha > fechaHasta) return false
        return true
      })
      .reduce((acc, r) => {
        const existing = acc.find((a) => a.tipo === r.tipo)
        if (existing) existing.monto += Number(r.monto)
        else acc.push({ tipo: r.tipo, monto: Number(r.monto) })
        return acc
      }, [] as { tipo: string; monto: number }[])

    // Percepciones por tipo
    const percepcionesPorTipo = percepciones
      .filter((p) => {
        if (fechaDesde && p.fecha < fechaDesde) return false
        if (fechaHasta && p.fecha > fechaHasta) return false
        return true
      })
      .reduce((acc, p) => {
        const existing = acc.find((a) => a.tipo === p.tipo)
        if (existing) existing.monto += Number(p.monto)
        else acc.push({ tipo: p.tipo, monto: Number(p.monto) })
        return acc
      }, [] as { tipo: string; monto: number }[])

    const totalRetenciones = retencionesPorTipo.reduce((sum, r) => sum + r.monto, 0)
    const totalPercepciones = percepcionesPorTipo.reduce((sum, p) => sum + p.monto, 0)

    return {
      ivaDebitoFiscal,
      ivaCreditoFiscal,
      saldoIVA: ivaDebitoFiscal - ivaCreditoFiscal,
      retenciones: retencionesPorTipo,
      percepciones: percepcionesPorTipo,
      totalRetenciones,
      totalPercepciones,
    }
  }

  return {
    retenciones,
    percepciones,
    loading,
    error,
    fetchRetenciones,
    fetchPercepciones,
    createRetencion,
    deleteRetencion,
    createPercepcion,
    deletePercepcion,
    fetchResumen,
  }
}

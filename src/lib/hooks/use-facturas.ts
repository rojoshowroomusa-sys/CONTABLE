'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComprobanteFiscal, CreateComprobanteInput, PuntoVenta } from '@/types/facturacion'

export function useFacturas(empresaId: string | null) {
  const [facturas, setFacturas] = useState<ComprobanteFiscal[]>([])
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchFacturas = useCallback(async (tipo?: string, operacion?: string) => {
    if (!empresaId) {
      setFacturas([])
      setLoading(false)
      return
    }

    setLoading(true)
    let query = supabase
      .from('comprobantes_fiscales')
      .select('*, items_comprobante(*), puntos_venta(*)')
      .eq('empresa_id', empresaId)
      .order('fecha', { ascending: false })

    if (tipo) query = query.eq('tipo', tipo)
    if (operacion) query = query.eq('operacion', operacion)

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setFacturas(data || [])
      setError(null)
    }
    setLoading(false)
  }, [empresaId, supabase])

  const fetchPuntosVenta = useCallback(async () => {
    if (!empresaId) return

    const { data } = await supabase
      .from('puntos_venta')
      .select('*')
      .eq('empresa_id', empresaId)

    setPuntosVenta(data || [])
  }, [empresaId, supabase])

  useEffect(() => {
    fetchFacturas()
    fetchPuntosVenta()
  }, [fetchFacturas, fetchPuntosVenta])

  const createFactura = async (input: CreateComprobanteInput) => {
    const { items, ...comprobanteData } = input

    // Calcular totales
    let netoGravado = 0
    let totalIva = 0
    let totalExento = 0

    const itemsCalculados = items.map((item, index) => {
      const subtotal = item.cantidad * item.precio_unitario
      const montoIva = subtotal * (item.alicuota_iva / 100)

      if (item.alicuota_iva > 0) {
        netoGravado += subtotal
        totalIva += montoIva
      } else {
        totalExento += subtotal
      }

      return {
        ...item,
        orden: index + 1,
        subtotal,
      }
    })

    const total = netoGravado + totalIva + totalExento

    // Obtener siguiente número
    const { data: pv } = await supabase
      .from('puntos_venta')
      .select('ultimo_numero')
      .eq('id', input.punto_venta_id)
      .single()

    const siguienteNumero = (pv?.ultimo_numero || 0) + 1

    // Crear comprobante
    const { data: comprobante, error: comprobanteError } = await supabase
      .from('comprobantes_fiscales')
      .insert({
        ...comprobanteData,
        numero: siguienteNumero,
        neto_gravado: netoGravado,
        iva: totalIva,
        exento: totalExento,
        total,
      })
      .select()
      .single()

    if (comprobanteError) {
      setError(comprobanteError.message)
      return null
    }

    // Crear items
    const itemsData = itemsCalculados.map((item) => ({
      ...item,
      comprobante_id: comprobante.id,
    }))

    const { error: itemsError } = await supabase
      .from('items_comprobante')
      .insert(itemsData)

    if (itemsError) {
      await supabase.from('comprobantes_fiscales').delete().eq('id', comprobante.id)
      setError(itemsError.message)
      return null
    }

    // Actualizar último número
    await supabase
      .from('puntos_venta')
      .update({ ultimo_numero: siguienteNumero })
      .eq('id', input.punto_venta_id)

    // Fetch completo
    const { data: completo } = await supabase
      .from('comprobantes_fiscales')
      .select('*, items_comprobante(*), puntos_venta(*)')
      .eq('id', comprobante.id)
      .single()

    if (completo) {
      setFacturas((prev) => [completo, ...prev])
    }
    return completo
  }

  const emitirFactura = async (id: string) => {
    const { data, error } = await supabase
      .from('comprobantes_fiscales')
      .update({ estado: 'emitido' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    setFacturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, estado: 'emitido' } : f))
    )
    return data
  }

  const anularFactura = async (id: string) => {
    const { error } = await supabase
      .from('comprobantes_fiscales')
      .update({ estado: 'anulado' })
      .eq('id', id)

    if (error) {
      setError(error.message)
      return false
    }

    setFacturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, estado: 'anulado' } : f))
    )
    return true
  }

  return {
    facturas,
    puntosVenta,
    loading,
    error,
    fetchFacturas,
    fetchPuntosVenta,
    createFactura,
    emitirFactura,
    anularFactura,
  }
}

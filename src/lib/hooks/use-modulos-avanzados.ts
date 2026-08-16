'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  ConvenioMultilateral,
  Producto,
  MovimientoStock,
  Empleado,
  CreateConvenioInput,
  CreateProductoInput,
  CreateMovimientoStockInput,
  CreateEmpleadoInput,
} from '@/types/modulos-avanzados'

export function useModulosAvanzados(empresaId: string | null) {
  const [convenios, setConvenios] = useState<ConvenioMultilateral[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchConvenios = useCallback(async () => {
    if (!empresaId) { setConvenios([]); return }
    const { data, error } = await supabase
      .from('convenios_multilaterales')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('numero')
    if (error) setError(error.message)
    else setConvenios(data || [])
  }, [empresaId, supabase])

  const fetchProductos = useCallback(async () => {
    if (!empresaId) { setProductos([]); return }
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('descripcion')
    if (error) setError(error.message)
    else setProductos(data || [])
  }, [empresaId, supabase])

  const fetchEmpleados = useCallback(async () => {
    if (!empresaId) { setEmpleados([]); return }
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('nombre')
    if (error) setError(error.message)
    else setEmpleados(data || [])
  }, [empresaId, supabase])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      await Promise.all([fetchConvenios(), fetchProductos(), fetchEmpleados()])
      setLoading(false)
    }
    fetchAll()
  }, [fetchConvenios, fetchProductos, fetchEmpleados])

  const createConvenio = async (input: CreateConvenioInput) => {
    const { data, error } = await supabase.from('convenios_multilaterales').insert(input).select().single()
    if (error) { setError(error.message); return null }
    setConvenios((prev) => [...prev, data])
    return data
  }

  const createProducto = async (input: CreateProductoInput) => {
    const { data, error } = await supabase.from('productos').insert(input).select().single()
    if (error) { setError(error.message); return null }
    setProductos((prev) => [...prev, data].sort((a, b) => a.descripcion.localeCompare(b.descripcion)))
    return data
  }

  const addMovimientoStock = async (input: CreateMovimientoStockInput) => {
    const producto = productos.find((p) => p.id === input.producto_id)
    if (!producto) return null

    const total = input.cantidad * input.precio_unitario
    const nuevoStock = input.tipo === 'ingreso' || input.tipo === 'ajuste'
      ? Number(producto.stock_actual) + input.cantidad
      : Number(producto.stock_actual) - input.cantidad

    const { data, error } = await supabase
      .from('movimientos_stock')
      .insert({ ...input, total })
      .select('*, productos(*)')
      .single()

    if (error) { setError(error.message); return null }

    // Actualizar stock del producto
    await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id', input.producto_id)
    setProductos((prev) => prev.map((p) => p.id === input.producto_id ? { ...p, stock_actual: nuevoStock } : p))
    return data
  }

  const fetchMovimientosStock = async (productoId: string): Promise<MovimientoStock[]> => {
    const { data, error } = await supabase
      .from('movimientos_stock')
      .select('*, productos(*)')
      .eq('producto_id', productoId)
      .order('fecha', { ascending: false })
      .limit(100)
    if (error) { setError(error.message); return [] }
    return data || []
  }

  const createEmpleado = async (input: CreateEmpleadoInput) => {
    const { data, error } = await supabase.from('empleados').insert(input).select().single()
    if (error) { setError(error.message); return null }
    setEmpleados((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    return data
  }

  const deleteEmpleado = async (id: string) => {
    const { error } = await supabase.from('empleados').update({ activo: false }).eq('id', id)
    if (error) { setError(error.message); return false }
    setEmpleados((prev) => prev.filter((e) => e.id !== id))
    return true
  }

  return {
    convenios,
    productos,
    empleados,
    loading,
    error,
    fetchConvenios,
    fetchProductos,
    fetchEmpleados,
    createConvenio,
    createProducto,
    addMovimientoStock,
    fetchMovimientosStock,
    createEmpleado,
    deleteEmpleado,
  }
}

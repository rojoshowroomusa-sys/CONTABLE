'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlanCuenta, CreatePlanCuentaInput } from '@/types/contabilidad'

export function usePlanCuentas(empresaId: string | null) {
  const [cuentas, setCuentas] = useState<PlanCuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCuentas = useCallback(async () => {
    if (!empresaId) {
      setCuentas([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('plan_cuentas')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('codigo_cuenta')

    if (error) {
      setError(error.message)
    } else {
      setCuentas(data || [])
      setError(null)
    }
    setLoading(false)
  }, [empresaId, supabase])

  useEffect(() => {
    fetchCuentas()
  }, [fetchCuentas])

  const createCuenta = async (input: CreatePlanCuentaInput) => {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .insert(input)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    setCuentas((prev) => [...prev, data].sort((a, b) => a.codigo_cuenta.localeCompare(b.codigo_cuenta)))
    return data
  }

  const updateCuenta = async (id: string, input: Partial<CreatePlanCuentaInput>) => {
    const { data, error } = await supabase
      .from('plan_cuentas')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    setCuentas((prev) =>
      prev.map((c) => (c.id === id ? data : c))
    )
    return data
  }

  const deleteCuenta = async (id: string) => {
    const { error } = await supabase.from('plan_cuentas').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return false
    }

    setCuentas((prev) => prev.filter((c) => c.id !== id))
    return true
  }

  // Construir árbol jerárquico
  const buildTree = useCallback((): PlanCuenta[] => {
    const map = new Map<string, PlanCuenta & { children: PlanCuenta[] }>()
    const roots: (PlanCuenta & { children: PlanCuenta[] })[] = []

    for (const cuenta of cuentas) {
      map.set(cuenta.id, { ...cuenta, children: [] })
    }

    for (const cuenta of cuentas) {
      const node = map.get(cuenta.id)!
      if (cuenta.padre_id && map.has(cuenta.padre_id)) {
        map.get(cuenta.padre_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return roots
  }, [cuentas])

  return {
    cuentas,
    loading,
    error,
    fetchCuentas,
    createCuenta,
    updateCuenta,
    deleteCuenta,
    buildTree,
  }
}

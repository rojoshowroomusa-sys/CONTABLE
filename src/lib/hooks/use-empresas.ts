'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Empresa {
  id: string
  razon_social: string
  identificacion_fiscal: string
  regimen_fiscal: string
  estudio_id: string
  created_at: string
}

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchEmpresas()
  }, [])

  const fetchEmpresas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('razon_social')

    if (error) {
      setError(error.message)
    } else {
      setEmpresas(data || [])
    }
    setLoading(false)
  }

  const createEmpresa = async (empresa: Omit<Empresa, 'id' | 'created_at' | 'estudio_id'>) => {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresa)
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    setEmpresas((prev) => [...prev, data])
    return data
  }

  const deleteEmpresa = async (id: string) => {
    const { error } = await supabase.from('empresas').delete().eq('id', id)

    if (error) {
      setError(error.message)
      return false
    }

    setEmpresas((prev) => prev.filter((e) => e.id !== id))
    return true
  }

  return { empresas, loading, error, fetchEmpresas, createEmpresa, deleteEmpresa }
}

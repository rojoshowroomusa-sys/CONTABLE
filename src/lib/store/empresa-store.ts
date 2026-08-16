'use client'

import { create } from 'zustand'

interface EmpresaState {
  empresaActual: string | null
  setEmpresaActual: (id: string) => void
}

export const useEmpresaStore = create<EmpresaState>((set) => ({
  empresaActual: null,
  setEmpresaActual: (id) => set({ empresaActual: id }),
}))

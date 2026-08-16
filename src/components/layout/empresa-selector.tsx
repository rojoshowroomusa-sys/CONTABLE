'use client'

import { useEmpresaStore } from '@/lib/store/empresa-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2 } from 'lucide-react'

const empresasMock = [
  { id: '1', razon_social: 'Empresa Ejemplo S.A.' },
  { id: '2', razon_social: 'Transporte López S.R.L.' },
  { id: '3', razon_social: 'Comercio García Hnos.' },
]

export function EmpresaSelector() {
  const { empresaActual, setEmpresaActual } = useEmpresaStore()

  return (
    <Select
      value={empresaActual || ''}
      onValueChange={setEmpresaActual}
    >
      <SelectTrigger className="w-[220px]">
        <Building2 className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Seleccionar empresa" />
      </SelectTrigger>
      <SelectContent>
        {empresasMock.map((empresa) => (
          <SelectItem key={empresa.id} value={empresa.id}>
            {empresa.razon_social}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

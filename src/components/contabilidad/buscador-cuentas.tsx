'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import type { PlanCuenta } from '@/types/contabilidad'

interface BuscadorCuentasProps {
  cuentas: PlanCuenta[]
  value?: string
  onSelect: (cuenta: PlanCuenta | null) => void
  placeholder?: string
}

export function BuscadorCuentas({
  cuentas,
  value,
  onSelect,
  placeholder = 'Buscar cuenta...',
}: BuscadorCuentasProps) {
  const cuentaSeleccionada = cuentas.find((c) => c.id === value)

  return (
    <div className="flex items-center gap-2">
      <Select value={value || ''} onValueChange={(val) => {
        const cuenta = cuentas.find((c) => c.id === val)
        onSelect(cuenta || null)
      }}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder}>
            {cuentaSeleccionada
              ? `${cuentaSeleccionada.codigo_cuenta} - ${cuentaSeleccionada.nombre}`
              : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {cuentas.map((cuenta) => (
            <SelectItem key={cuenta.id} value={cuenta.id}>
              {cuenta.codigo_cuenta} - {cuenta.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

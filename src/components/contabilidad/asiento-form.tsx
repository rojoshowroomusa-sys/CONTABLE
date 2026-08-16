'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PlanCuenta } from '@/types/contabilidad'
import { formatCurrency } from '@/lib/utils'

interface LineaAsientoForm {
  cuenta_id: string
  debe: number
  haber: number
}

interface AsientoFormProps {
  cuentas: PlanCuenta[]
  empresaId: string
  initialData?: {
    id?: string
    fecha: string
    concepto: string
    lineas: LineaAsientoForm[]
  }
  onSubmit: (data: any) => Promise<any>
  onCancel?: () => void
}

export function AsientoForm({
  cuentas,
  empresaId,
  initialData,
  onSubmit,
  onCancel,
}: AsientoFormProps) {
  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().split('T')[0])
  const [concepto, setConcepto] = useState(initialData?.concepto || '')
  const [lineas, setLineas] = useState<LineaAsientoForm[]>(
    initialData?.lineas || [
      { cuenta_id: '', debe: 0, haber: 0 },
      { cuenta_id: '', debe: 0, haber: 0 },
    ]
  )
  const [loading, setLoading] = useState(false)

  const totalDebe = lineas.reduce((sum, l) => sum + l.debe, 0)
  const totalHaber = lineas.reduce((sum, l) => sum + l.haber, 0)
  const diferencia = totalDebe - totalHaber
  const isBalanced = diferencia === 0 && totalDebe > 0

  const addLinea = () => {
    setLineas([...lineas, { cuenta_id: '', debe: 0, haber: 0 }])
  }

  const removeLinea = (index: number) => {
    if (lineas.length <= 2) {
      toast.error('Debe haber al menos 2 líneas')
      return
    }
    setLineas(lineas.filter((_, i) => i !== index))
  }

  const updateLinea = (index: number, field: keyof LineaAsientoForm, value: any) => {
    const newLineas = [...lineas]
    newLineas[index] = { ...newLineas[index], [field]: value }
    setLineas(newLineas)
  }

  const handleSubmit = async () => {
    if (!concepto.trim()) {
      toast.error('El concepto es requerido')
      return
    }

    const validLineas = lineas.filter((l) => l.cuenta_id)
    if (validLineas.length < 2) {
      toast.error('Debe haber al menos 2 líneas con cuenta seleccionada')
      return
    }

    if (!isBalanced) {
      toast.error(`El asiento no está balanceado. Diferencia: ${formatCurrency(Math.abs(diferencia))}`)
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        empresa_id: empresaId,
        fecha,
        concepto,
        lineas: validLineas,
      })
      toast.success(initialData?.id ? 'Asiento actualizado' : 'Asiento creado')
    } catch (error) {
      toast.error('Error al guardar el asiento')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Concepto</Label>
          <Input
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Descripción del asiento"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Líneas del Asiento</Label>
          <Button variant="outline" size="sm" onClick={addLinea}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Línea
          </Button>
        </div>

        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 bg-muted p-2 text-sm font-medium">
            <span>Cuenta</span>
            <span className="text-right">Debe</span>
            <span className="text-right">Haber</span>
            <span></span>
          </div>
          {lineas.map((linea, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_120px_120px_40px] gap-2 border-t p-2"
            >
              <Select
                value={linea.cuenta_id}
                onValueChange={(value) => updateLinea(index, 'cuenta_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.codigo_cuenta} - {cuenta.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={linea.debe || ''}
                onChange={(e) =>
                  updateLinea(index, 'debe', parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="text-right"
              />
              <Input
                type="number"
                value={linea.haber || ''}
                onChange={(e) =>
                  updateLinea(index, 'haber', parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="text-right"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => removeLinea(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 border-t bg-muted/50 p-2 text-sm font-medium">
            <span className="text-right">Totales</span>
            <span className="text-right">{formatCurrency(totalDebe)}</span>
            <span className="text-right">{formatCurrency(totalHaber)}</span>
            <span></span>
          </div>
        </div>

        {!isBalanced && totalDebe > 0 && (
          <p className="text-sm text-destructive">
            El asiento no está balanceado. Diferencia: {formatCurrency(Math.abs(diferencia))}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={loading || !isBalanced}>
          {loading ? 'Guardando...' : initialData?.id ? 'Actualizar' : 'Crear Asiento'}
        </Button>
      </div>
    </div>
  )
}

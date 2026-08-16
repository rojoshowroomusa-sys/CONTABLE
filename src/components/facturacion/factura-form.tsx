'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CreateComprobanteInput } from '@/types/facturacion'

interface ItemForm {
  descripcion: string
  cantidad: number
  precio_unitario: number
  alicuota_iva: number
}

interface FacturaFormProps {
  puntosVenta: { id: string; numero: number; tipo_comprobante: string; ultimo_numero: number }[]
  empresaId: string
  operacion: 'venta' | 'compra'
  tipo: string
  initialData?: CreateComprobanteInput
  onSubmit: (data: CreateComprobanteInput) => Promise<any>
  onCancel?: () => void
}

const ALICUOTAS = [0, 10.5, 21, 27]

export function FacturaForm({
  puntosVenta,
  empresaId,
  operacion,
  tipo,
  onSubmit,
  onCancel,
}: FacturaFormProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [razonSocial, setRazonSocial] = useState('')
  const [identificacionFiscal, setIdentificacionFiscal] = useState('')
  const [tipoIva, setTipoIva] = useState('responsable_inscripto')
  const [puntoVentaId, setPuntoVentaId] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState<ItemForm[]>([
    { descripcion: '', cantidad: 1, precio_unitario: 0, alicuota_iva: 21 },
  ])
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precio_unitario: 0, alicuota_iva: 21 }])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ItemForm, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  // Cálculos
  const itemsCalculados = items.map((item) => {
    const subtotal = item.cantidad * item.precio_unitario
    const iva = subtotal * (item.alicuota_iva / 100)
    return { ...item, subtotal, iva }
  })

  const netoGravado = itemsCalculados
    .filter((i) => i.alicuota_iva > 0)
    .reduce((sum, i) => sum + i.subtotal, 0)

  const totalIva = itemsCalculados
    .filter((i) => i.alicuota_iva > 0)
    .reduce((sum, i) => sum + i.iva, 0)

  const totalExento = itemsCalculados
    .filter((i) => i.alicuota_iva === 0)
    .reduce((sum, i) => sum + i.subtotal, 0)

  const total = netoGravado + totalIva + totalExento

  const pvSeleccionado = puntosVenta.find((pv) => pv.id === puntoVentaId)
  const siguienteNumero = pvSeleccionado ? pvSeleccionado.ultimo_numero + 1 : 1

  const handleSubmit = async () => {
    if (!razonSocial.trim() || !identificacionFiscal.trim() || !puntoVentaId) return

    setLoading(true)
    try {
      await onSubmit({
        empresa_id: empresaId,
        tipo: tipo as any,
        operacion,
        punto_venta_id: puntoVentaId,
        fecha,
        razon_social: razonSocial,
        identificacion_fiscal: identificacionFiscal,
        tipo_iva: tipoIva,
        items: items.filter((i) => i.descripcion.trim()),
        notas,
      })
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Punto de Venta</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={puntoVentaId}
            onChange={(e) => setPuntoVentaId(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {puntosVenta
              .filter((pv) => pv.tipo_comprobante === tipo)
              .map((pv) => (
                <option key={pv.id} value={pv.id}>
                  {String(pv.numero).padStart(5, '0')} (Próx: {pv.ultimo_numero + 1})
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Razón Social</Label>
          <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Nombre del cliente/proveedor" />
        </div>
        <div className="space-y-2">
          <Label>CUIT/DNI</Label>
          <Input value={identificacionFiscal} onChange={(e) => setIdentificacionFiscal(e.target.value)} placeholder="XX-XXXXXXXX-X" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Condición IVA</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={tipoIva}
            onChange={(e) => setTipoIva(e.target.value)}
          >
            <option value="responsable_inscripto">Responsable Inscripto</option>
            <option value="monotributo">Monotributo</option>
            <option value="exento">Exento</option>
            <option value="consumidor_final">Consumidor Final</option>
          </select>
        </div>
        {pvSeleccionado && (
          <div className="space-y-2">
            <Label>Comprobante</Label>
            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-mono">
              {String(pvSeleccionado.numero).padStart(5, '0')}-{String(siguienteNumero).padStart(8, '0')}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Ítems</Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Ítem
          </Button>
        </div>

        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_80px_120px_80px_120px_40px] gap-2 bg-muted p-2 text-xs font-medium">
            <span>Descripción</span>
            <span className="text-right">Cant.</span>
            <span className="text-right">P. Unit.</span>
            <span>IVA %</span>
            <span className="text-right">Subtotal</span>
            <span></span>
          </div>
          {items.map((item, index) => {
            const subtotal = item.cantidad * item.precio_unitario
            return (
              <div key={index} className="grid grid-cols-[1fr_80px_120px_80px_120px_40px] gap-2 border-t p-2">
                <Input
                  value={item.descripcion}
                  onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                  placeholder="Descripción del ítem"
                />
                <Input
                  type="number"
                  value={item.cantidad || ''}
                  onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                  className="text-right"
                />
                <Input
                  type="number"
                  value={item.precio_unitario || ''}
                  onChange={(e) => updateItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                  className="text-right"
                />
                <select
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                  value={item.alicuota_iva}
                  onChange={(e) => updateItem(index, 'alicuota_iva', parseFloat(e.target.value))}
                >
                  {ALICUOTAS.map((a) => (
                    <option key={a} value={a}>{a}%</option>
                  ))}
                </select>
                <span className="flex items-center justify-end text-sm">{formatCurrency(subtotal)}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-md border bg-muted/50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Neto Gravado:</span>
          <span>{formatCurrency(netoGravado)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>IVA:</span>
          <span>{formatCurrency(totalIva)}</span>
        </div>
        {totalExento > 0 && (
          <div className="flex justify-between text-sm">
            <span>Exento:</span>
            <span>{formatCurrency(totalExento)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas adicionales (opcional)" />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        )}
        <Button onClick={handleSubmit} disabled={loading || !puntoVentaId || !razonSocial.trim()}>
          {loading ? 'Guardando...' : 'Crear Comprobante'}
        </Button>
      </div>
    </div>
  )
}

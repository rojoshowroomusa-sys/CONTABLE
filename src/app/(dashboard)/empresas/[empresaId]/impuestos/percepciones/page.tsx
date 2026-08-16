'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useImpuestos } from '@/lib/hooks/use-impuestos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const tipoLabels: Record<string, string> = {
  iva: 'IVA', ganancias: 'Ganancias', iibb: 'IIBB', suss: 'SUSS', otros: 'Otros',
}

export default function PercepcionesPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { percepciones, loading, createPercepcion, deletePercepcion } = useImpuestos(empresaId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tipo, setTipo] = useState('iva')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [numero, setNumero] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [identificacionFiscal, setIdentificacionFiscal] = useState('')
  const [baseImponible, setBaseImponible] = useState(0)
  const [alicuota, setAlicuota] = useState(0)

  const handleCreate = async () => {
    if (!razonSocial || !identificacionFiscal || !numero) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    const result = await createPercepcion({
      empresa_id: empresaId,
      tipo: tipo as any,
      fecha,
      numero,
      tercero_tipo: 'cliente',
      razon_social: razonSocial,
      identificacion_fiscal: identificacionFiscal,
      base_imponible: baseImponible,
      alicuota,
    })
    if (result) {
      toast.success('Percepción registrada')
      setDialogOpen(false)
      setNumero('')
      setRazonSocial('')
      setIdentificacionFiscal('')
      setBaseImponible(0)
      setAlicuota(0)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Percepciones</h1>
          <p className="text-muted-foreground">Percepciones aplicadas a clientes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Percepción
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Percepciones ({percepciones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[80px_60px_1fr_100px_60px_100px] gap-2 bg-muted p-2 text-xs font-medium">
              <span>Fecha</span>
              <span>Tipo</span>
              <span>Sujeto</span>
              <span className="text-right">Base Imp.</span>
              <span className="text-right">Alíq.</span>
              <span className="text-right">Monto</span>
            </div>
            {percepciones.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay percepciones registradas
              </div>
            ) : (
              percepciones.map((p) => (
                <div key={p.id} className="grid grid-cols-[80px_60px_1fr_100px_60px_100px] gap-2 border-t p-2 text-sm items-center">
                  <span className="text-xs">{p.fecha}</span>
                  <span className="text-xs">{tipoLabels[p.tipo] || p.tipo}</span>
                  <span className="truncate text-xs">{p.razon_social}</span>
                  <span className="text-right text-xs">{formatCurrency(p.base_imponible)}</span>
                  <span className="text-right text-xs">{p.alicuota}%</span>
                  <span className="text-right text-xs font-medium text-green-600">{formatCurrency(p.monto)}</span>
                </div>
              ))
            )}
            {percepciones.length > 0 && (
              <div className="grid grid-cols-[80px_60px_1fr_100px_60px_100px] gap-2 border-t bg-muted/50 p-2 text-sm font-bold">
                <span className="col-span-4 text-right">Total Percepciones</span>
                <span className="text-right text-green-600">
                  {formatCurrency(percepciones.reduce((sum, p) => sum + Number(p.monto), 0))}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Percepción</DialogTitle>
            <DialogDescription>Registró una percepción aplicada a un cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iva">IVA</SelectItem>
                    <SelectItem value="ganancias">Ganancias</SelectItem>
                    <SelectItem value="iibb">IIBB</SelectItem>
                    <SelectItem value="suss">SUSS</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número de percepción" />
            </div>
            <div className="space-y-2">
              <Label>Razón Social</Label>
              <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="space-y-2">
              <Label>CUIT/DNI</Label>
              <Input value={identificacionFiscal} onChange={(e) => setIdentificacionFiscal(e.target.value)} placeholder="XX-XXXXXXXX-X" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Imponible</Label>
                <Input type="number" value={baseImponible || ''} onChange={(e) => setBaseImponible(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Alícuota (%)</Label>
                <Input type="number" value={alicuota || ''} onChange={(e) => setAlicuota(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="font-medium">Monto percibido: </span>
              <span className="font-bold">
                ${(baseImponible * alicuota / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

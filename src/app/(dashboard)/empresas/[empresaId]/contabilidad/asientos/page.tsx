'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useEmpresaStore } from '@/lib/store/empresa-store'
import { useAsientos } from '@/lib/hooks/use-asientos'
import { usePlanCuentas } from '@/lib/hooks/use-plan-cuentas'
import { AsientoForm } from '@/components/contabilidad/asiento-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Eye, Check, Trash2, Search } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import type { AsientoContable, FiltroAsientos } from '@/types/contabilidad'

export default function AsientosPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { asientos, loading, createAsiento, asentarAsiento, deleteAsiento } = useAsientos(empresaId)
  const { cuentas } = usePlanCuentas(empresaId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewAsiento, setViewAsiento] = useState<AsientoContable | null>(null)
  const [filtros, setFiltros] = useState<FiltroAsientos>({})

  const filteredAsientos = asientos.filter((a) => {
    if (filtros.estado && a.estado !== filtros.estado) return false
    if (filtros.fecha_desde && a.fecha < filtros.fecha_desde) return false
    if (filtros.fecha_hasta && a.fecha > filtros.fecha_hasta) return false
    return true
  })

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
          <h1 className="text-3xl font-bold tracking-tight">Asientos Contables</h1>
          <p className="text-muted-foreground">Registro de asientos contables</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Asiento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={filtros.fecha_desde || ''}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={filtros.fecha_hasta || ''}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filtros.estado || ''}
                onValueChange={(v) => setFiltros({ ...filtros, estado: (v || undefined) as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="asentado">Asentado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asientos ({filteredAsientos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[100px_1fr_150px_100px_120px] gap-2 bg-muted p-2 text-sm font-medium">
              <span>Fecha</span>
              <span>Concepto</span>
              <span>Estado</span>
              <span className="text-right">Debe</span>
              <span className="text-right">Haber</span>
            </div>
            {filteredAsientos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay asientos registrados
              </div>
            ) : (
              filteredAsientos.map((asiento) => {
                const totalDebe = asiento.lineas?.reduce((sum, l) => sum + Number(l.debe), 0) || 0
                const totalHaber = asiento.lineas?.reduce((sum, l) => sum + Number(l.haber), 0) || 0

                return (
                  <div
                    key={asiento.id}
                    className="grid grid-cols-[100px_1fr_150px_100px_120px] gap-2 border-t p-2 text-sm items-center"
                  >
                    <span>{formatDate(asiento.fecha)}</span>
                    <span className="truncate">{asiento.concepto}</span>
                    <Badge variant={asiento.estado === 'asentado' ? 'success' : 'warning'}>
                      {asiento.estado === 'asentado' ? 'Asentado' : 'Borrador'}
                    </Badge>
                    <span className="text-right">{formatCurrency(totalDebe)}</span>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewAsiento(asiento)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {asiento.estado === 'borrador' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={async () => {
                            await asentarAsiento(asiento.id)
                            toast.success('Asiento asentado')
                          }}
                        >
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={async () => {
                          if (confirm('¿Eliminar este asiento?')) {
                            await deleteAsiento(asiento.id)
                            toast.success('Asiento eliminado')
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Nuevo Asiento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nuevo Asiento Contable</DialogTitle>
            <DialogDescription>
              Creá un nuevo asiento contable con sus líneas de debe y haber
            </DialogDescription>
          </DialogHeader>
          <AsientoForm
            cuentas={cuentas}
            empresaId={empresaId}
            onSubmit={async (data) => {
              await createAsiento(data)
              setDialogOpen(false)
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Asiento */}
      <Dialog open={!!viewAsiento} onOpenChange={() => setViewAsiento(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Asiento</DialogTitle>
          </DialogHeader>
          {viewAsiento && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(viewAsiento.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={viewAsiento.estado === 'asentado' ? 'success' : 'warning'}>
                    {viewAsiento.estado === 'asentado' ? 'Asentado' : 'Borrador'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concepto</p>
                <p className="font-medium">{viewAsiento.concepto}</p>
              </div>
              <div className="rounded-md border">
                <div className="grid grid-cols-[1fr_100px_100px] gap-2 bg-muted p-2 text-sm font-medium">
                  <span>Cuenta</span>
                  <span className="text-right">Debe</span>
                  <span className="text-right">Haber</span>
                </div>
                {viewAsiento.lineas?.map((linea) => (
                  <div
                    key={linea.id}
                    className="grid grid-cols-[1fr_100px_100px] gap-2 border-t p-2 text-sm"
                  >
                    <span>{linea.cuenta?.codigo_cuenta} - {linea.cuenta?.nombre}</span>
                    <span className="text-right">{formatCurrency(Number(linea.debe))}</span>
                    <span className="text-right">{formatCurrency(Number(linea.haber))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

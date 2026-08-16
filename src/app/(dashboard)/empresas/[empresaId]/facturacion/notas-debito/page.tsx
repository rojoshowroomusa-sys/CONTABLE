'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useFacturas } from '@/lib/hooks/use-facturas'
import { FacturaForm } from '@/components/facturacion/factura-form'
import { VistaPreviaPDF } from '@/components/facturacion/vista-previa-pdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function NotasDebitoPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { facturas, puntosVenta, loading, createFactura } = useFacturas(empresaId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewFactura, setPreviewFactura] = useState<any>(null)

  const notasDebito = facturas.filter((f) => f.tipo === 'nota_debito')

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
          <h1 className="text-3xl font-bold tracking-tight">Notas de Débito</h1>
          <p className="text-muted-foreground">Notas de débito emitidas y recibidas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Nota de Débito
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas de Débito ({notasDebito.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[80px_100px_80px_1fr_120px] gap-2 bg-muted p-2 text-sm font-medium">
              <span>Fecha</span>
              <span>Número</span>
              <span>Tipo</span>
              <span>Razón Social</span>
              <span className="text-right">Total</span>
            </div>
            {notasDebito.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay notas de débito
              </div>
            ) : (
              notasDebito.map((nd) => (
                <div key={nd.id} className="grid grid-cols-[80px_100px_80px_1fr_120px] gap-2 border-t p-2 text-sm items-center">
                  <span>{formatDate(nd.fecha)}</span>
                  <span className="font-mono text-xs">
                    {String(nd.punto_venta?.numero || 0).padStart(5, '0')}-{String(nd.numero).padStart(8, '0')}
                  </span>
                  <span className="text-xs capitalize">{nd.operacion}</span>
                  <span className="truncate">{nd.razon_social}</span>
                  <div className="flex items-center justify-end gap-1">
                    <span>{formatCurrency(nd.total)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewFactura(nd)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nueva Nota de Débito</DialogTitle>
            <DialogDescription>Emití una nota de débito para recargos o ajustes</DialogDescription>
          </DialogHeader>
          <FacturaForm
            puntosVenta={puntosVenta}
            empresaId={empresaId}
            operacion="venta"
            tipo="nota_debito"
            onSubmit={async (data) => {
              await createFactura({ ...data, tipo: 'nota_debito' as any })
              setDialogOpen(false)
              toast.success('Nota de débito creada')
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewFactura} onOpenChange={() => setPreviewFactura(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          {previewFactura && <VistaPreviaPDF comprobante={previewFactura} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

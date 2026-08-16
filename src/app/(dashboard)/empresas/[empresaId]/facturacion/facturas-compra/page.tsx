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
import { Plus, Eye, Check } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) {
  const styles: Record<string, string> = {
    emitido: 'bg-green-100 text-green-800',
    borrador: 'bg-yellow-100 text-yellow-800',
    anulado: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[variant] || styles.borrador}`}>
      {children}
    </span>
  )
}

export default function FacturasCompraPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { facturas, puntosVenta, loading, createFactura, emitirFactura } = useFacturas(empresaId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewFactura, setPreviewFactura] = useState<any>(null)

  const facturasCompra = facturas.filter((f) => f.operacion === 'compra')

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
          <h1 className="text-3xl font-bold tracking-tight">Facturas de Compra</h1>
          <p className="text-muted-foreground">Gestión de facturas recibidas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Factura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas ({facturasCompra.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[80px_100px_1fr_120px_100px] gap-2 bg-muted p-2 text-sm font-medium">
              <span>Fecha</span>
              <span>Número</span>
              <span>Proveedor</span>
              <span className="text-right">Total</span>
              <span>Estado</span>
            </div>
            {facturasCompra.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay facturas de compra
              </div>
            ) : (
              facturasCompra.map((factura) => (
                <div key={factura.id} className="grid grid-cols-[80px_100px_1fr_120px_100px] gap-2 border-t p-2 text-sm items-center">
                  <span>{formatDate(factura.fecha)}</span>
                  <span className="font-mono text-xs">
                    {String(factura.punto_venta?.numero || 0).padStart(5, '0')}-{String(factura.numero).padStart(8, '0')}
                  </span>
                  <span className="truncate">{factura.razon_social}</span>
                  <span className="text-right">{formatCurrency(factura.total)}</span>
                  <div className="flex gap-1 items-center">
                    <Badge variant={factura.estado}>{factura.estado}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewFactura(factura)}>
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
            <DialogTitle>Nueva Factura de Compra</DialogTitle>
            <DialogDescription>Registrá una factura recibida de un proveedor</DialogDescription>
          </DialogHeader>
          <FacturaForm
            puntosVenta={puntosVenta}
            empresaId={empresaId}
            operacion="compra"
            tipo="factura_a"
            onSubmit={async (data) => {
              await createFactura(data)
              setDialogOpen(false)
              toast.success('Factura registrada correctamente')
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

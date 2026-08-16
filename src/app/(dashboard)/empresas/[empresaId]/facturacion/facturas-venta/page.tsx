'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useFacturas } from '@/lib/hooks/use-facturas'
import { FacturaForm } from '@/components/facturacion/factura-form'
import { VistaPreviaPDF } from '@/components/facturacion/vista-previa-pdf'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Check, Ban, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function FacturasVentaPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { facturas, puntosVenta, loading, createFactura, emitirFactura, anularFactura } = useFacturas(empresaId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewFactura, setViewFactura] = useState<any>(null)
  const [previewFactura, setPreviewFactura] = useState<any>(null)

  const facturasVenta = facturas.filter((f) => f.operacion === 'venta' && f.tipo === 'factura_a')

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
          <h1 className="text-3xl font-bold tracking-tight">Facturas de Venta</h1>
          <p className="text-muted-foreground">Gestión de facturas emitidas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Factura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas ({facturasVenta.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[80px_100px_1fr_120px_100px] gap-2 bg-muted p-2 text-sm font-medium">
              <span>Fecha</span>
              <span>Número</span>
              <span>Cliente</span>
              <span className="text-right">Total</span>
              <span>Estado</span>
            </div>
            {facturasVenta.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No hay facturas de venta
              </div>
            ) : (
              facturasVenta.map((factura) => (
                <div key={factura.id} className="grid grid-cols-[80px_100px_1fr_120px_100px] gap-2 border-t p-2 text-sm items-center">
                  <span>{formatDate(factura.fecha)}</span>
                  <span className="font-mono text-xs">
                    {String(factura.punto_venta?.numero || 0).padStart(5, '0')}-{String(factura.numero).padStart(8, '0')}
                  </span>
                  <span className="truncate">{factura.razon_social}</span>
                  <span className="text-right">{formatCurrency(factura.total)}</span>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className={factura.estado === 'emitido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{factura.estado}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewFactura(factura)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    {factura.estado === 'borrador' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={async () => {
                        await emitirFactura(factura.id)
                        toast.success('Factura emitida')
                      }}>
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                    )}
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
            <DialogTitle>Nueva Factura de Venta</DialogTitle>
            <DialogDescription>Completá los datos para emitir una factura</DialogDescription>
          </DialogHeader>
          <FacturaForm
            puntosVenta={puntosVenta}
            empresaId={empresaId}
            operacion="venta"
            tipo="factura_a"
            onSubmit={async (data) => {
              await createFactura(data)
              setDialogOpen(false)
              toast.success('Factura creada correctamente')
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

'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useModulosAvanzados } from '@/lib/hooks/use-modulos-avanzados'
import { formatCurrency } from '@/lib/utils'
import type { TipoProducto, TipoMovimientoStock } from '@/types/modulos-avanzados'

export default function StockPage() {
  const params = useParams()
  const empresaId = params.empresaId as string
  const { productos, loading, createProducto, addMovimientoStock, fetchMovimientosStock } = useModulosAvanzados(empresaId)
  const [showForm, setShowForm] = useState(false)
  const [showMovForm, setShowMovForm] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<string | null>(null)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('todos')
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    tipo: 'producto' as TipoProducto,
    precio_compra: '',
    precio_venta: '',
    stock_minimo: '',
    unidad_medida: 'un',
    alicuota_iva: '21',
  })
  const [movForm, setMovForm] = useState({
    producto_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'ingreso' as TipoMovimientoStock,
    cantidad: '',
    precio_unitario: '',
    notas: '',
  })

  const handleCreateProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProducto({
      empresa_id: empresaId,
      codigo: formData.codigo,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      precio_compra: parseFloat(formData.precio_compra) || 0,
      precio_venta: parseFloat(formData.precio_venta) || 0,
      stock_minimo: parseFloat(formData.stock_minimo) || 0,
      unidad_medida: formData.unidad_medida,
      alicuota_iva: parseFloat(formData.alicuota_iva) || 21,
    })
    setFormData({ codigo: '', descripcion: '', tipo: 'producto', precio_compra: '', precio_venta: '', stock_minimo: '', unidad_medida: 'un', alicuota_iva: '21' })
    setShowForm(false)
  }

  const handleAddMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    await addMovimientoStock({
      empresa_id: empresaId,
      producto_id: movForm.producto_id || selectedProducto!,
      fecha: movForm.fecha,
      tipo: movForm.tipo,
      cantidad: parseFloat(movForm.cantidad),
      precio_unitario: parseFloat(movForm.precio_unitario),
      notas: movForm.notas || undefined,
    })
    setMovForm({ producto_id: '', fecha: new Date().toISOString().split('T')[0], tipo: 'ingreso', cantidad: '', precio_unitario: '', notas: '' })
    setShowMovForm(false)
    if (selectedProducto) {
      const data = await fetchMovimientosStock(selectedProducto)
      setMovimientos(data)
    }
  }

  const handleSelectProducto = async (id: string) => {
    setSelectedProducto(id)
    const data = await fetchMovimientosStock(id)
    setMovimientos(data)
  }

  const filteredProductos = filter === 'todos' ? productos : productos.filter((p) => p.tipo === filter)
  const stockBajo = productos.filter((p) => p.stock_actual <= p.stock_minimo && p.tipo === 'producto')

  if (loading) return <Skeleton className="h-[500px] w-full" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock / Productos</h1>
          <p className="text-muted-foreground">Gestión de productos, servicios y control de stock</p>
        </div>
        <div className="flex gap-2">
          {selectedProducto && <Button onClick={() => setShowMovForm(!showMovForm)}>{showMovForm ? 'Cancelar' : '+ Movimiento'}</Button>}
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo Producto'}</Button>
        </div>
      </div>

      {stockBajo.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader><CardTitle className="text-sm text-yellow-700">Stock Bajo Mínimo ({stockBajo.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stockBajo.map((p) => (
                <Badge key={p.id} variant="secondary" className="bg-yellow-100 text-yellow-800">{p.descripcion}: {p.stock_actual} {p.unidad_medida}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Producto</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProducto} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Código</Label><Input value={formData.codigo} onChange={(e) => setFormData((p) => ({ ...p, codigo: e.target.value }))} required /></div>
                <div className="col-span-2"><Label>Descripción</Label><Input value={formData.descripcion} onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))} required /></div>
                <div><Label>Tipo</Label><Select value={formData.tipo} onValueChange={(v) => setFormData((p) => ({ ...p, tipo: v as TipoProducto }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="producto">Producto</SelectItem><SelectItem value="servicio">Servicio</SelectItem><SelectItem value="materia_prima">Materia Prima</SelectItem></SelectContent>
                </Select></div>
                <div><Label>Precio Compra</Label><Input type="number" step="0.01" value={formData.precio_compra} onChange={(e) => setFormData((p) => ({ ...p, precio_compra: e.target.value }))} /></div>
                <div><Label>Precio Venta</Label><Input type="number" step="0.01" value={formData.precio_venta} onChange={(e) => setFormData((p) => ({ ...p, precio_venta: e.target.value }))} /></div>
                <div><Label>Stock Mínimo</Label><Input type="number" step="0.01" value={formData.stock_minimo} onChange={(e) => setFormData((p) => ({ ...p, stock_minimo: e.target.value }))} /></div>
                <div><Label>Unidad</Label><Select value={formData.unidad_medida} onValueChange={(v) => setFormData((p) => ({ ...p, unidad_medida: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="un">Unidad</SelectItem><SelectItem value="kg">Kilogramo</SelectItem><SelectItem value="lt">Litro</SelectItem><SelectItem value="m">Metro</SelectItem><SelectItem value="m2">Metro²</SelectItem></SelectContent>
                </Select></div>
                <div><Label>IVA %</Label><Input type="number" step="0.01" value={formData.alicuota_iva} onChange={(e) => setFormData((p) => ({ ...p, alicuota_iva: e.target.value }))} /></div>
              </div>
              <Button type="submit">Guardar Producto</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showMovForm && (
        <Card>
          <CardHeader><CardTitle>Nuevo Movimiento de Stock</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddMovimiento} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Fecha</Label><Input type="date" value={movForm.fecha} onChange={(e) => setMovForm((p) => ({ ...p, fecha: e.target.value }))} required /></div>
                <div><Label>Tipo</Label><Select value={movForm.tipo} onValueChange={(v) => setMovForm((p) => ({ ...p, tipo: v as TipoMovimientoStock }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ingreso">Ingreso</SelectItem><SelectItem value="egreso">Egreso</SelectItem><SelectItem value="ajuste">Ajuste</SelectItem></SelectContent>
                </Select></div>
                <div><Label>Cantidad</Label><Input type="number" step="0.01" value={movForm.cantidad} onChange={(e) => setMovForm((p) => ({ ...p, cantidad: e.target.value }))} required /></div>
                <div><Label>Precio Unitario</Label><Input type="number" step="0.01" value={movForm.precio_unitario} onChange={(e) => setMovForm((p) => ({ ...p, precio_unitario: e.target.value }))} required /></div>
              </div>
              <Button type="submit">Guardar Movimiento</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {['todos', 'producto', 'servicio', 'materia_prima'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'todos' ? 'Todos' : f.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <div className="grid grid-cols-[80px_1fr_80px_100px_100px_80px_100px] gap-2 bg-muted p-2 text-xs font-medium">
              <span>Código</span><span>Descripción</span><span>Stock</span><span>P. Compra</span><span>P. Venta</span><span>Un.</span><span>Valor</span>
            </div>
            {filteredProductos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin productos registrados</div>
            ) : (
              filteredProductos.map((p) => (
                <div key={p.id} className={`grid grid-cols-[80px_1fr_80px_100px_100px_80px_100px] gap-2 border-t p-2 text-sm cursor-pointer hover:bg-muted/50 ${selectedProducto === p.id ? 'bg-muted' : ''}`} onClick={() => handleSelectProducto(p.id)}>
                  <span className="font-mono">{p.codigo}</span>
                  <span className="truncate">{p.descripcion}</span>
                  <span className={`${Number(p.stock_actual) <= Number(p.stock_minimo) ? 'text-red-600 font-bold' : ''}`}>{p.stock_actual}</span>
                  <span className="text-right">{formatCurrency(p.precio_compra)}</span>
                  <span className="text-right">{formatCurrency(p.precio_venta)}</span>
                  <span>{p.unidad_medida}</span>
                  <span className="text-right">{formatCurrency(Number(p.stock_actual) * Number(p.precio_compra))}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedProducto && movimientos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Movimientos del Producto Seleccionado</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-[100px_80px_100px_100px_100px_1fr] gap-2 bg-muted p-2 text-xs font-medium">
                <span>Fecha</span><span>Tipo</span><span>Cantidad</span><span>Precio</span><span>Total</span><span>Notas</span>
              </div>
              {movimientos.map((m) => (
                <div key={m.id} className="grid grid-cols-[100px_80px_100px_100px_100px_1fr] gap-2 border-t p-2 text-sm">
                  <span>{new Date(m.fecha).toLocaleDateString('es-AR')}</span>
                  <Badge variant="secondary" className={m.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{m.tipo}</Badge>
                  <span>{m.cantidad}</span>
                  <span className="text-right">{formatCurrency(m.precio_unitario)}</span>
                  <span className="text-right font-medium">{formatCurrency(m.total)}</span>
                  <span className="truncate text-muted-foreground">{m.notas || '-'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

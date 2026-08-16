'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    empresa_nombre: '',
    cuit: '',
    domicilio_fiscal: '',
    telefono: '',
    email: '',
    condicion_iva: 'responsable_inscripto',
  })

  const handleSave = () => {
    // Placeholder - integrar con Supabase
    alert('Configuración guardada (pendiente de integración con BD)')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Configuración general del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Razón Social</Label>
              <Input value={config.empresa_nombre} onChange={(e) => setConfig((p) => ({ ...p, empresa_nombre: e.target.value }))} />
            </div>
            <div>
              <Label>CUIT</Label>
              <Input value={config.cuit} onChange={(e) => setConfig((p) => ({ ...p, cuit: e.target.value }))} />
            </div>
            <div>
              <Label>Domicilio Fiscal</Label>
              <Input value={config.domicilio_fiscal} onChange={(e) => setConfig((p) => ({ ...p, domicilio_fiscal: e.target.value }))} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={config.telefono} onChange={(e) => setConfig((p) => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={config.email} onChange={(e) => setConfig((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <Button onClick={handleSave}>Guardar Configuración</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Versión</span>
              <Badge>1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Framework</span>
              <Badge variant="secondary">Next.js 14</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Base de Datos</span>
              <Badge variant="secondary">Supabase PostgreSQL</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Última actualización</span>
              <Badge variant="secondary">{new Date().toLocaleDateString('es-AR')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

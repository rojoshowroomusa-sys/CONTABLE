'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search, Building2 } from 'lucide-react'

const empresasMock = [
  { id: '1', razon_social: 'Empresa Ejemplo S.A.', identificacion_fiscal: '30-71234567-9', regimen_fiscal: 'General' },
  { id: '2', razon_social: 'Transporte López S.R.L.', identificacion_fiscal: '30-72345678-0', regimen_fiscal: 'General' },
  { id: '3', razon_social: 'Comercio García Hnos.', identificacion_fiscal: '30-73456789-1', regimen_fiscal: 'Monotributo' },
]

export default function EmpresasPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = empresasMock.filter((e) =>
    e.razon_social.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">Gestioná las empresas del estudio</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Empresa</DialogTitle>
              <DialogDescription>
                Completá los datos para crear una nueva empresa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social</Label>
                <Input id="razon_social" placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identificacion_fiscal">CUIT</Label>
                <Input id="identificacion_fiscal" placeholder="XX-XXXXXXXX-X" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regimen_fiscal">Régimen Fiscal</Label>
                <Input id="regimen_fiscal" placeholder="General / Monotributo" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => setOpen(false)}>Crear Empresa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((empresa) => (
          <Card key={empresa.id} className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{empresa.razon_social}</CardTitle>
                <CardDescription>{empresa.identificacion_fiscal}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Régimen: {empresa.regimen_fiscal}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

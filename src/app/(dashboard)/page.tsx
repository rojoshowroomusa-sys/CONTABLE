'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, BookOpen, TrendingUp } from 'lucide-react'

const stats = [
  { title: 'Empresas Activas', value: '12', icon: Building2, change: '+2 este mes' },
  { title: 'Usuarios', value: '24', icon: Users, change: '+4 este mes' },
  { title: 'Asientos del Mes', value: '156', icon: BookOpen, change: '+18% vs anterior' },
  { title: 'Facturación Mensual', value: '$2.4M', icon: TrendingUp, change: '+12% vs anterior' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido, {user?.user_metadata?.nombre || user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos asientos contables registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay actividad reciente para mostrar.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Operaciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <a href="/contabilidad/asientos">Nuevo Asiento Contable</a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/facturacion/facturas-venta">Nueva Factura de Venta</a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href="/tesoreria/pagos-cobros">Registrar Pago/Cobro</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

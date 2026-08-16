'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, BookOpen, FileText, Receipt, Users, Wallet, BarChart3 } from 'lucide-react'
import Link from 'next/link'

const modulos = [
  { label: 'Contabilidad', icon: BookOpen, href: '/contabilidad/plan-cuentas', description: 'Plan de cuentas, asientos, diario, mayor' },
  { label: 'Facturación', icon: FileText, href: '/facturacion/facturas-venta', description: 'Facturas, notas de crédito/débito' },
  { label: 'Impuestos', icon: Receipt, href: '/impuestos/iva', description: 'IVA, retenciones, percepciones' },
  { label: 'Cuentas Corrientes', icon: Users, href: '/cuentas-corrientes/clientes', description: 'Clientes, proveedores, letras' },
  { label: 'Tesorería', icon: Wallet, href: '/tesoreria/caja', description: 'Caja, bancos, conciliación' },
  { label: 'Reportes', icon: BarChart3, href: '/reportes/balance-general', description: 'Balance, estado de resultados' },
]

export default function EmpresaDetailPage() {
  const params = useParams()
  const empresaId = params.empresaId as string

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresa</h1>
          <p className="text-muted-foreground">Resumen y módulos disponibles</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modulos.map((modulo) => (
          <Link key={modulo.href} href={`/empresas/${empresaId}${modulo.href}`}>
            <Card className="cursor-pointer transition-colors hover:bg-accent h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <modulo.icon className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>{modulo.label}</CardTitle>
                    <CardDescription>{modulo.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

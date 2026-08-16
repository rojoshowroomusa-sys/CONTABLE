'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  empresas: 'Empresas',
  contabilidad: 'Contabilidad',
  'plan-cuentas': 'Plan de Cuentas',
  asientos: 'Asientos',
  diario: 'Libro Diario',
  mayor: 'Libro Mayor',
  balance: 'Balance',
  periodos: 'Períodos',
  facturacion: 'Facturación',
  'facturas-venta': 'Facturas Venta',
  'facturas-compra': 'Facturas Compra',
  'notas-credito': 'Notas Crédito',
  'notas-debito': 'Notas Débito',
  impuestos: 'Impuestos',
  iva: 'IVA',
  retenciones: 'Retenciones',
  percepciones: 'Percepciones',
  'libro-iva': 'Libro IVA',
  'cuentas-corrientes': 'Cuentas Corrientes',
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  letras: 'Letras',
  cheques: 'Cheques',
  tesoreria: 'Tesorería',
  caja: 'Caja',
  bancos: 'Bancos',
  conciliacion: 'Conciliación',
  'pagos-cobros': 'Pagos/Cobros',
  reportes: 'Reportes',
  'balance-general': 'Balance General',
  'estado-resultados': 'Estado Resultados',
  'flujo-caja': 'Flujo de Caja',
  configuracion: 'Configuración',
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = routeLabels[segment] || segment
    const isLast = index === segments.length - 1

    return { href, label, isLast }
  })

  return (
    <nav className="flex items-center space-x-1 text-sm">
      <Link href="/" className="text-muted-foreground hover:text-foreground">
        Inicio
      </Link>
      {breadcrumbs.map((breadcrumb) => (
        <div key={breadcrumb.href} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {breadcrumb.isLast ? (
            <span className="font-medium">{breadcrumb.label}</span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

import {
  LayoutDashboard,
  Building2,
  BookOpen,
  FileText,
  Receipt,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Puzzle,
} from 'lucide-react'

export interface MenuItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  children?: { label: string; href: string }[]
}

export const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Empresas', icon: Building2, href: '/empresas' },
]

export const empresaMenuItems: MenuItem[] = [
  {
    label: 'Contabilidad',
    icon: BookOpen,
    href: '/contabilidad',
    children: [
      { label: 'Plan de Cuentas', href: '/contabilidad/plan-cuentas' },
      { label: 'Asientos', href: '/contabilidad/asientos' },
      { label: 'Diario', href: '/contabilidad/diario' },
      { label: 'Mayor', href: '/contabilidad/mayor' },
      { label: 'Balance', href: '/contabilidad/balance' },
      { label: 'Períodos', href: '/contabilidad/periodos' },
    ],
  },
  {
    label: 'Facturación',
    icon: FileText,
    href: '/facturacion',
    children: [
      { label: 'Facturas Venta', href: '/facturacion/facturas-venta' },
      { label: 'Facturas Compra', href: '/facturacion/facturas-compra' },
      { label: 'Notas Crédito', href: '/facturacion/notas-credito' },
      { label: 'Notas Débito', href: '/facturacion/notas-debito' },
    ],
  },
  {
    label: 'Impuestos',
    icon: Receipt,
    href: '/impuestos',
    children: [
      { label: 'IVA', href: '/impuestos/iva' },
      { label: 'Retenciones', href: '/impuestos/retenciones' },
      { label: 'Percepciones', href: '/impuestos/percepciones' },
      { label: 'Libro IVA', href: '/impuestos/libro-iva' },
    ],
  },
  {
    label: 'Cuentas Corrientes',
    icon: Users,
    href: '/cuentas-corrientes',
    children: [
      { label: 'Clientes', href: '/cuentas-corrientes/clientes' },
      { label: 'Proveedores', href: '/cuentas-corrientes/proveedores' },
      { label: 'Letras', href: '/cuentas-corrientes/letras' },
      { label: 'Cheques', href: '/cuentas-corrientes/cheques' },
    ],
  },
  {
    label: 'Tesorería',
    icon: Wallet,
    href: '/tesoreria',
    children: [
      { label: 'Caja', href: '/tesoreria/caja' },
      { label: 'Bancos', href: '/tesoreria/bancos' },
      { label: 'Conciliación', href: '/tesoreria/conciliacion' },
      { label: 'Pagos/Cobros', href: '/tesoreria/pagos-cobros' },
    ],
  },
  {
    label: 'Módulos Avanzados',
    icon: Puzzle,
    href: '/modulos-avanzados',
    children: [
      { label: 'Convenios', href: '/modulos-avanzados/convenios' },
      { label: 'Stock / Productos', href: '/modulos-avanzados/stock' },
      { label: 'Recursos Humanos', href: '/modulos-avanzados/rrhh' },
    ],
  },
  {
    label: 'Reportes',
    icon: BarChart3,
    href: '/reportes',
    children: [
      { label: 'Balance General', href: '/reportes/balance-general' },
      { label: 'Estado Resultados', href: '/reportes/estado-resultados' },
      { label: 'Flujo Caja', href: '/reportes/flujo-caja' },
    ],
  },
  { label: 'Configuración', icon: Settings, href: '/configuracion' },
]

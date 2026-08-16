'use client'

import { useEmpresaStore } from '@/lib/store/empresa-store'
import { usePlanCuentas } from '@/lib/hooks/use-plan-cuentas'
import { PlanCuentasTree } from '@/components/contabilidad/plan-cuentas-tree'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function PlanCuentasPage() {
  const { empresaActual } = useEmpresaStore()
  const { cuentas, loading, createCuenta, updateCuenta, deleteCuenta } = usePlanCuentas(empresaActual)

  if (!empresaActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Seleccioná una empresa para ver el plan de cuentas</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plan de Cuentas</h1>
        <p className="text-muted-foreground">
          Gestión del plan de cuentas jerárquico
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estructura de Cuentas</CardTitle>
          <CardDescription>
            Organizá las cuentas en una estructura jerárquica. Haz clic en una cuenta para ver sus detalles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanCuentasTree
            cuentas={cuentas}
            empresaId={empresaActual}
            onCreate={async (data) => {
              const result = await createCuenta(data)
              if (result) toast.success('Cuenta creada correctamente')
            }}
            onUpdate={async (id, data) => {
              const result = await updateCuenta(id, data)
              if (result) toast.success('Cuenta actualizada')
            }}
            onDelete={async (id) => {
              const result = await deleteCuenta(id)
              if (result) toast.success('Cuenta eliminada')
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{cuentas.filter(c => c.tipo === 'activo').length}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{cuentas.filter(c => c.tipo === 'pasivo').length}</p>
              <p className="text-sm text-muted-foreground">Pasivos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{cuentas.filter(c => c.tipo === 'patrimonio').length}</p>
              <p className="text-sm text-muted-foreground">Patrimonio</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{cuentas.filter(c => c.tipo === 'ingreso').length}</p>
              <p className="text-sm text-muted-foreground">Ingresos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{cuentas.filter(c => c.tipo === 'egreso').length}</p>
              <p className="text-sm text-muted-foreground">Egresos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

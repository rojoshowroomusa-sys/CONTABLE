import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const empresa_id = searchParams.get('empresa_id')
  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')

  if (!empresa_id) {
    return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
  }

  // Obtener todas las cuentas del plan
  const { data: cuentas, error: cuentasError } = await supabase
    .from('plan_cuentas')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('codigo_cuenta')

  if (cuentasError) {
    return NextResponse.json({ error: cuentasError.message }, { status: 500 })
  }

  // Obtener todas las líneas de asiento de la empresa en el rango de fechas
  let lineasQuery = supabase
    .from('lineas_asiento')
    .select('*, asientos_contables!inner(empresa_id, fecha)')
    .eq('asientos_contables.empresa_id', empresa_id)

  if (fecha_desde) lineasQuery = lineasQuery.gte('asientos_contables.fecha', fecha_desde)
  if (fecha_hasta) lineasQuery = lineasQuery.lte('asientos_contables.fecha', fecha_hasta)

  const { data: lineas, error: lineasError } = await lineasQuery

  if (lineasError) {
    return NextResponse.json({ error: lineasError.message }, { status: 500 })
  }

  // Calcular balance por cuenta
  const balanceMap = new Map<string, { debe: number; haber: number }>()

  for (const linea of lineas || []) {
    const actual = balanceMap.get(linea.cuenta_id) || { debe: 0, haber: 0 }
    actual.debe += Number(linea.debe)
    actual.haber += Number(linea.haber)
    balanceMap.set(linea.cuenta_id, actual)
  }

  const balance = (cuentas || []).map((cuenta) => {
    const totals = balanceMap.get(cuenta.id) || { debe: 0, haber: 0 }
    let saldo = 0

    if (cuenta.tipo === 'activo' || cuenta.tipo === 'egreso') {
      saldo = totals.debe - totals.haber
    } else {
      saldo = totals.haber - totals.debe
    }

    return {
      cuenta_id: cuenta.id,
      codigo_cuenta: cuenta.codigo_cuenta,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      total_debe: totals.debe,
      total_haber: totals.haber,
      saldo,
    }
  }).filter((b) => b.total_debe > 0 || b.total_haber > 0)

  const totalDebe = balance.reduce((sum, b) => sum + b.total_debe, 0)
  const totalHaber = balance.reduce((sum, b) => sum + b.total_haber, 0)

  return NextResponse.json({
    cuentas: balance,
    totales: {
      debe: totalDebe,
      haber: totalHaber,
      diferencia: totalDebe - totalHaber,
    },
  })
}

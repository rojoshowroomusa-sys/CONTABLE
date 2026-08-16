import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const empresa_id = searchParams.get('empresa_id')
  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')
  const estado = searchParams.get('estado')

  if (!empresa_id) {
    return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
  }

  let query = supabase
    .from('asientos_contables')
    .select('*, lineas_asiento(*, plan_cuentas(*))')
    .eq('empresa_id', empresa_id)
    .order('fecha', { ascending: false })

  if (fecha_desde) query = query.gte('fecha', fecha_desde)
  if (fecha_hasta) query = query.lte('fecha', fecha_hasta)
  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { lineas, ...asientoData } = body

  // Crear el asiento
  const { data: asiento, error: asientoError } = await supabase
    .from('asientos_contables')
    .insert(asientoData)
    .select()
    .single()

  if (asientoError) {
    return NextResponse.json({ error: asientoError.message }, { status: 500 })
  }

  // Crear las líneas del asiento
  const lineasConAsientoId = lineas.map((l: any) => ({
    ...l,
    asiento_id: asiento.id,
  }))

  const { error: lineasError } = await supabase
    .from('lineas_asiento')
    .insert(lineasConAsientoId)

  if (lineasError) {
    // Rollback: eliminar el asiento si falla la inserción de líneas
    await supabase.from('asientos_contables').delete().eq('id', asiento.id)
    return NextResponse.json({ error: lineasError.message }, { status: 500 })
  }

  // Retornar el asiento con sus líneas
  const { data: asientoCompleto } = await supabase
    .from('asientos_contables')
    .select('*, lineas_asiento(*, plan_cuentas(*))')
    .eq('id', asiento.id)
    .single()

  return NextResponse.json(asientoCompleto, { status: 201 })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { id, lineas, ...updateData } = body

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }

  // Actualizar el asiento
  const { error: asientoError } = await supabase
    .from('asientos_contables')
    .update(updateData)
    .eq('id', id)

  if (asientoError) {
    return NextResponse.json({ error: asientoError.message }, { status: 500 })
  }

  // Si se proporcionan líneas, reemplazarlas
  if (lineas) {
    // Eliminar líneas existentes
    await supabase.from('lineas_asiento').delete().eq('asiento_id', id)

    // Insertar nuevas líneas
    const lineasConAsientoId = lineas.map((l: any) => ({
      ...l,
      asiento_id: id,
    }))

    const { error: lineasError } = await supabase
      .from('lineas_asiento')
      .insert(lineasConAsientoId)

    if (lineasError) {
      return NextResponse.json({ error: lineasError.message }, { status: 500 })
    }
  }

  // Retornar el asiento actualizado
  const { data } = await supabase
    .from('asientos_contables')
    .select('*, lineas_asiento(*, plan_cuentas(*))')
    .eq('id', id)
    .single()

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }

  // Las líneas se eliminan en cascada por FK
  const { error } = await supabase.from('asientos_contables').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

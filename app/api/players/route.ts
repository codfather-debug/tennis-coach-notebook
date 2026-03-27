import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('players')
    .select('id, name, email, created_at')
    .eq('coach_id', session.user.id)
    .order('name')

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('players')
    .insert({ coach_id: session.user.id, name: name.trim(), email: email?.trim() || null })
    .select('id, name, email, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name, email } = await request.json()

  const { data, error } = await supabase
    .from('players')
    .update({ name: name?.trim(), email: email?.trim() || null })
    .eq('id', id)
    .eq('coach_id', session.user.id)
    .select('id, name, email, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()

  await supabase.from('players').delete().eq('id', id).eq('coach_id', session.user.id)
  return NextResponse.json({ ok: true })
}

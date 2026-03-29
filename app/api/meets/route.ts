import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json([], { status: 401 })

  const { data } = await supabase
    .from('meets')
    .select('*')
    .eq('coach_id', session.user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  const { data, error } = await supabase
    .from('meets')
    .insert({ coach_id: session.user.id, name })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, deleteMatches } = await req.json()

  if (deleteMatches) {
    // Delete all matches belonging to this meet first
    await supabase.from('matches').delete().eq('meet_id', id).eq('coach_id', session.user.id)
  } else {
    // Unlink matches so they remain in history without the meet grouping
    await supabase.from('matches').update({ meet_id: null }).eq('meet_id', id).eq('coach_id', session.user.id)
  }

  await supabase.from('meets').delete().eq('id', id).eq('coach_id', session.user.id)
  return NextResponse.json({ ok: true })
}

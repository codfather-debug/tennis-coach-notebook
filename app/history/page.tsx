import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import HistoryClient from '@/components/HistoryClient'

export default async function HistoryPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [matchesRes, meetsRes] = await Promise.all([
    supabase
      .from('matches')
      .select('*, notes(*)')
      .eq('coach_id', session.user.id)
      .eq('status', 'finished')
      .order('ended_at', { ascending: false })
      .limit(100),
    supabase
      .from('meets')
      .select('*')
      .eq('coach_id', session.user.id)
      .order('created_at', { ascending: false }),
  ])

  const transformed = (matchesRes.data ?? []).map(m => ({
    ...m,
    ai_summary: m.ai_summary ?? null,
    notes: (m.notes ?? []).map((n: any) => ({
      id: n.id,
      matchId: n.match_id,
      content: n.content,
      tags: n.tags ?? [],
      timestamp: n.note_timestamp,
    })),
  }))

  const meets = (meetsRes.data ?? []).map(m => ({
    id: m.id,
    name: m.name,
    created_at: m.created_at,
  }))

  return <HistoryClient matches={transformed} meets={meets} />
}

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import HistoryClient from '@/components/HistoryClient'

export default async function HistoryPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: matches } = await supabase
    .from('matches')
    .select('*, notes(*)')
    .eq('coach_id', session.user.id)
    .eq('status', 'finished')
    .order('ended_at', { ascending: false })
    .limit(50)

  // Transform notes from snake_case DB fields to camelCase app types
  const transformed = (matches ?? []).map(m => ({
    ...m,
    notes: (m.notes ?? []).map((n: any) => ({
      id: n.id,
      matchId: n.match_id,
      content: n.content,
      tags: n.tags ?? [],
      timestamp: n.note_timestamp,
    })),
  }))

  return <HistoryClient matches={transformed} />
}

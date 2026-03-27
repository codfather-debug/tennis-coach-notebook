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

  return <HistoryClient matches={matches ?? []} />
}

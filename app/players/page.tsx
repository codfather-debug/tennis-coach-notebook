import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PlayersClient from '@/components/PlayersClient'

export default async function PlayersPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: players } = await supabase
    .from('players')
    .select('id, name, email, created_at')
    .eq('coach_id', session.user.id)
    .order('name')

  return <PlayersClient initialPlayers={players ?? []} />
}

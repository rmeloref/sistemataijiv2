import { getCurrentProfile } from '@/lib/supabase/profile'
import { AgendaClient } from '@/components/agenda/agenda-client'
import { redirect } from 'next/navigation'

export default async function AgendaPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  return <AgendaClient customerId={profile.customer.id} />
}

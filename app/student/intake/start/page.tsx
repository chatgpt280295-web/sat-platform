// ── Imports ────────────────────────────────────────────────────────────────────
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function IntakeStartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/student/intake/start')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()
  const { data: results } = await admin
    .from('diagnostic_results')
    .select('subject')
    .eq('user_id', profile.id)

  const hasMath    = (results ?? []).some((r: any) => r.subject === 'math')
  const hasEnglish = (results ?? []).some((r: any) => r.subject === 'english')

  if (hasMath && hasEnglish) {
    redirect('/student/intake/result')
  } else if (hasMath) {
    redirect('/student/intake/english?next=/student/intake/result')
  } else {
    const next = encodeURIComponent('/student/intake/english?next=/student/intake/result')
    redirect(`/student/intake/math?next=${next}`)
  }
}

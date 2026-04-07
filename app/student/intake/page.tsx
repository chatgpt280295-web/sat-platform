import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function IntakePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Đã có tier → xem kết quả
  if (profile.tier) redirect('/student/intake/result')

  // Kiểm tra survey
  const { data: survey } = await supabase
    .from('intake_surveys').select('id').eq('user_id', profile.id).single()

  if (!survey) redirect('/student/intake/survey')
  redirect('/student/intake/test')
}

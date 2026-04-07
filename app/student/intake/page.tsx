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

  // Đã có tier trên users table → xem kết quả
  if (profile.tier) redirect('/student/intake/result')

  // Đã có kết quả diagnostic (vừa submit, tier chưa cache) → xem kết quả
  const { data: diag } = await supabase
    .from('diagnostic_results').select('id').eq('user_id', profile.id).limit(1).maybeSingle()
  if (diag) redirect('/student/intake/result')

  // Kiểm tra survey
  const { data: survey } = await supabase
    .from('intake_surveys').select('id').eq('user_id', profile.id).maybeSingle()
  if (!survey) redirect('/student/intake/survey')

  redirect('/student/intake/test')
}

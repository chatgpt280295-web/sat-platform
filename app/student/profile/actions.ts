'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return { error: 'Không tìm thấy người dùng' }

  const admin = createAdminClient()

  // Cập nhật full_name
  const fullName = (formData.get('full_name') as string)?.trim()
  if (fullName) {
    const { error } = await admin.from('users').update({ full_name: fullName }).eq('id', profile.id)
    if (error) return { error: error.message }
  }

  // Upsert intake_survey
  const { error: surveyErr } = await admin.from('intake_surveys').upsert({
    user_id:        profile.id,
    school:         (formData.get('school')         as string) || null,
    grade:          (formData.get('grade')          as string) || null,
    english_level:  (formData.get('english_level')  as string) || null,
    sat_target:     parseInt(formData.get('sat_target') as string) || null,
    hours_per_week: parseInt(formData.get('hours_per_week') as string) || null,
    strengths:      (formData.get('strengths')      as string) || null,
  }, { onConflict: 'user_id' })

  if (surveyErr) return { error: surveyErr.message }

  revalidatePath('/student/profile')
  revalidatePath('/student/dashboard')
  return { success: true }
}

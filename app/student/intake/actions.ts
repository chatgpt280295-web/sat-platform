'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveSurvey(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return { error: 'Không tìm thấy người dùng' }

  const { error } = await supabase.from('intake_surveys').upsert({
    user_id:       profile.id,
    school:        formData.get('school')        as string,
    grade:         formData.get('grade')         as string,
    english_level: formData.get('english_level') as string,
    sat_target:    parseInt(formData.get('sat_target') as string || '0'),
    hours_per_week: parseInt(formData.get('hours_per_week') as string || '0'),
    strengths:     formData.get('strengths')     as string,
  }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/student/intake')
  return { success: true }
}

export async function submitIntakeTest(
  answers: Record<string, string>
): Promise<{ success?: boolean; tier?: number; mathScore?: number; rwScore?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return { error: 'Không tìm thấy người dùng' }

  // Lấy đáp án đúng từ DB
  const questionIds = Object.keys(answers)
  const { data: questions } = await supabase
    .from('questions')
    .select('id, correct_answer, domain')
    .in('id', questionIds)

  let mathCorrect = 0, mathTotal = 0
  let rwCorrect = 0, rwTotal = 0

  for (const q of questions ?? []) {
    const isCorrect = answers[q.id] === q.correct_answer
    if (q.domain === 'Math') {
      mathTotal++
      if (isCorrect) mathCorrect++
    } else {
      rwTotal++
      if (isCorrect) rwCorrect++
    }
  }

  const mathScore = mathTotal > 0 ? Math.round((mathCorrect / mathTotal) * 100) : 0
  const rwScore   = rwTotal   > 0 ? Math.round((rwCorrect   / rwTotal)   * 100) : 0

  // Scale to SAT: 200-800 per section
  const mathSAT = Math.round(200 + (mathScore / 100) * 600)
  const rwSAT   = Math.round(200 + (rwScore   / 100) * 600)
  const totalSAT = mathSAT + rwSAT

  // Xếp tier
  let tier = 1
  if (totalSAT >= 1300) tier = 4
  else if (totalSAT >= 1100) tier = 3
  else if (totalSAT >= 900) tier = 2

  // Lưu kết quả
  await supabase.from('diagnostic_results').insert({
    user_id:    profile.id,
    tier,
    math_score: mathSAT,
    rw_score:   rwSAT,
  })

  // Cập nhật tier vào users
  await supabase.from('users').update({ tier }).eq('id', profile.id)

  revalidatePath('/student/intake')
  return { success: true, tier, mathScore: mathSAT, rwScore: rwSAT }
}

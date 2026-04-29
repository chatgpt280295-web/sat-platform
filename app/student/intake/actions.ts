'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function saveSurvey(_formData: FormData) {
  // intake_surveys table was removed in migration 006 — this is a no-op stub.
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

  const admin = createAdminClient()

  // Lưu kết quả — dùng admin client để bypass RLS
  const { error: insertErr } = await admin.from('diagnostic_results').upsert({
    user_id:     profile.id,
    tier,
    math_score:  mathSAT,
    rw_score:    rwSAT,
    total_score: totalSAT,
  }, { onConflict: 'user_id' })

  if (insertErr) return { error: insertErr.message }

  // Cập nhật tier vào users — dùng admin client để bypass RLS
  const { error: updateErr } = await admin.from('users').update({ tier }).eq('id', profile.id)
  if (updateErr) return { error: updateErr.message }

  // Lưu từng câu trả lời intake
  const intakeRows = (questions ?? []).map(q => ({
    user_id:       profile.id,
    question_id:   q.id,
    chosen_answer: answers[q.id] ?? null,
    is_correct:    answers[q.id] === q.correct_answer,
  }))
  if (intakeRows.length > 0) {
    await admin.from('intake_answers').upsert(intakeRows, { onConflict: 'user_id,question_id' })
  }

  revalidatePath('/student/intake')
  revalidatePath('/student/dashboard')
  return { success: true, tier, mathScore: mathSAT, rwScore: rwSAT }
}

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const SUBJECT_DOMAIN: Record<string, string> = {
  math:    'Math',
  english: 'Reading & Writing',
}

function scoreToLevel(score: number): 1 | 2 | 3 {
  if (score <= 450) return 1
  if (score <= 650) return 2
  return 3
}

export async function submitSubjectIntake(
  answers: Record<string, string>,
  subject: string
): Promise<{ score: number; level: 1 | 2 | 3 }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) throw new Error('Không tìm thấy user')

  const domain = SUBJECT_DOMAIN[subject]
  if (!domain) throw new Error('Subject không hợp lệ')

  const questionIds = Object.keys(answers)
  const { data: questions } = await supabase
    .from('questions')
    .select('id, correct_answer, domain')
    .in('id', questionIds)

  let correct = 0
  let total   = 0
  for (const q of questions ?? []) {
    total++
    if (answers[q.id] === q.correct_answer) correct++
  }

  const pct   = total > 0 ? correct / total : 0
  const score = Math.round(200 + pct * 600)
  const level = scoreToLevel(score)

  const admin = createAdminClient()
  const scoreKey = subject === 'math' ? 'math_score' : 'rw_score'

  // Try to find existing row for this user (may be single-row or per-subject design)
  const { data: existing } = await admin
    .from('diagnostic_results')
    .select('id, math_score, rw_score, subject')
    .eq('user_id', profile.id)
    .maybeSingle()

  let finalTier: 1 | 2 | 3 | 4 = level

  if (existing) {
    // Calculate combined tier if we now have both scores
    const mScore = subject === 'math' ? score : Number(existing.math_score ?? 0)
    const rScore = subject === 'english' ? score : Number(existing.rw_score ?? 0)
    if (mScore > 0 && rScore > 0) {
      const total = mScore + rScore
      if (total >= 1300) finalTier = 4
      else if (total >= 1100) finalTier = 3
      else if (total >= 900) finalTier = 2
      else finalTier = 1
    }
    const { error } = await admin.from('diagnostic_results')
      .update({ [scoreKey]: score, total_score: mScore + rScore || score, tier: finalTier })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await admin.from('diagnostic_results')
      .insert({ user_id: profile.id, subject, [scoreKey]: score, total_score: score, tier: level })
    if (error) throw new Error(error.message)
  }

  // Update users.tier when we have enough data
  await admin.from('users').update({ tier: finalTier }).eq('id', profile.id)

  // Save individual answers to intake_answers
  const intakeRows = (questions ?? []).map((q: any) => ({
    user_id:       profile.id,
    question_id:   q.id,
    chosen_answer: answers[q.id] ?? null,
    is_correct:    answers[q.id] === q.correct_answer,
  }))
  if (intakeRows.length > 0) {
    await admin.from('intake_answers').upsert(intakeRows, { onConflict: 'user_id,question_id' })
  }

  revalidatePath('/student/dashboard')
  revalidatePath(`/student/intake/${subject}/result`)
  revalidatePath('/student/intake/result')
  return { score, level }
}

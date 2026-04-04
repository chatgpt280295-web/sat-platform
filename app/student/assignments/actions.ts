'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startOrGetSession(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return { error: 'Không tìm thấy user' }

  // Check existing unfinished session
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', profile.id)
    .eq('assignment_id', assignmentId)
    .is('finished_at', null)
    .single()

  if (existing) return { success: true, sessionId: existing.id }

  // Count questions
  const { count } = await supabase
    .from('assignment_questions').select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)

  const admin = createAdminClient()
  const { data: session, error } = await admin.from('sessions').insert({
    user_id:         profile.id,
    assignment_id:   assignmentId,
    total_questions: count ?? 0,
  }).select('id').single()

  if (error) return { error: error.message }
  return { success: true, sessionId: session.id }
}

export async function submitSession(
  sessionId: string,
  answers: Record<string, string>  // questionId -> chosen answer
) {
  const admin = createAdminClient()

  // Get questions with correct answers
  const { data: session } = await admin
    .from('sessions').select('assignment_id').eq('id', sessionId).single()
  if (!session) return { error: 'Session không tồn tại' }

  const { data: aqList } = await admin
    .from('assignment_questions')
    .select('question_id, questions(correct_answer)')
    .eq('assignment_id', session.assignment_id)

  if (!aqList) return { error: 'Không tìm thấy câu hỏi' }

  // Calculate score
  let correctCount = 0
  const answerRows = aqList.map(aq => {
    const chosen     = answers[aq.question_id] ?? null
    const isCorrect  = chosen === (aq.questions as any)?.correct_answer
    if (isCorrect) correctCount++
    return {
      session_id:    sessionId,
      question_id:   aq.question_id,
      chosen_answer: chosen,
      is_correct:    isCorrect,
    }
  })

  await admin.from('answers').insert(answerRows)
  const score = aqList.length > 0 ? Math.round((correctCount / aqList.length) * 100) : 0

  const { error } = await admin.from('sessions').update({
    finished_at:   new Date().toISOString(),
    correct_count: correctCount,
    total_questions: aqList.length,
    score,
  }).eq('id', sessionId)

  if (error) return { error: error.message }
  revalidatePath('/student/results')
  return { success: true, score, correctCount, total: aqList.length }
}

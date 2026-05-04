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

  // Kiểm tra session đã hoàn thành — nếu có, trả về để redirect xem lại
  const { data: finished } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', profile.id)
    .eq('assignment_id', assignmentId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (finished) return { success: true, sessionId: finished.id, finished: true }

  // Session đang làm dở
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', profile.id)
    .eq('assignment_id', assignmentId)
    .is('finished_at', null)
    .maybeSingle()

  if (existing) return { success: true, sessionId: existing.id, finished: false }

  // Tạo session mới
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
  return { success: true, sessionId: session.id, finished: false }
}

export async function submitSession(
  sessionId: string,
  answers: Record<string, string>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return { error: 'Không tìm thấy user' }

  const admin = createAdminClient()

  // Fetch session with user_id for error logging
  const { data: session } = await admin
    .from('sessions')
    .select('assignment_id, user_id')
    .eq('id', sessionId)
    .single()
  if (!session) return { error: 'Session không tồn tại' }

  // Verify session belongs to the caller
  if (session.user_id !== profile.id) return { error: 'Không có quyền truy cập' }

  // Fetch questions with correct answer + domain/skill for error analysis
  const { data: aqList } = await admin
    .from('assignment_questions')
    .select('question_id, questions(correct_answer, domain, skill)')
    .eq('assignment_id', session.assignment_id)

  if (!aqList) return { error: 'Không tìm thấy câu hỏi' }

  let correctCount = 0
  const answerRows = aqList.map((aq: any) => {
    const chosen     = answers[aq.question_id] ?? null
    const correctAns = aq.questions?.correct_answer
    const isCorrect  = chosen !== null && chosen === correctAns
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
    finished_at:     new Date().toISOString(),
    correct_count:   correctCount,
    total_questions: aqList.length,
    score,
  }).eq('id', sessionId)

  if (error) return { error: error.message }

  // M05: Auto-log errors for wrong answers
  const errorRows = answerRows
    .filter((row: any) => !row.is_correct && row.chosen_answer !== null)
    .map((row: any) => {
      const aq = aqList.find((q: any) => q.question_id === row.question_id) as any
      return {
        user_id:       session.user_id,
        question_id:   row.question_id,
        session_id:    sessionId,
        assignment_id: session.assignment_id,
        domain:        aq?.questions?.domain ?? null,
        skill:         aq?.questions?.skill ?? null,
        chosen_answer: row.chosen_answer,
      }
    })

  if (errorRows.length > 0) {
    await admin.from('error_logs').insert(errorRows)
  }

  revalidatePath('/student/results')
  revalidatePath('/student/dashboard')
  return { success: true, score, correctCount, total: aqList.length }
}

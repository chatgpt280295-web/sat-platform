'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createAssignment(formData: FormData) {
  const admin = createAdminClient()
  const passingScore = parseInt(formData.get('passing_score') as string || '70')
  const { data, error } = await admin.from('assignments').insert({
    title:         formData.get('title')       as string,
    description:   formData.get('description') as string || null,
    due_date:      formData.get('due_date')    as string || null,
    course_id:     formData.get('course_id')   as string || null,
    passing_score: isNaN(passingScore) ? 70 : passingScore,
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/admin/assignments')
  return { success: true, id: data.id }
}

export async function deleteAssignment(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('assignments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/assignments')
  return { success: true }
}

export async function addQuestionToAssignment(assignmentId: string, questionId: string) {
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('assignment_questions')
    .select('id').eq('assignment_id', assignmentId).eq('question_id', questionId).single()
  if (existing) return { error: 'Câu hỏi đã có trong bài tập này' }

  const { data: maxPos } = await admin
    .from('assignment_questions').select('position')
    .eq('assignment_id', assignmentId).order('position', { ascending: false }).limit(1).single()

  const { error } = await admin.from('assignment_questions').insert({
    assignment_id: assignmentId,
    question_id:   questionId,
    position:      (maxPos?.position ?? -1) + 1,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/assignments/${assignmentId}`)
  return { success: true }
}

export async function removeQuestionFromAssignment(assignmentId: string, questionId: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('assignment_questions')
    .delete().eq('assignment_id', assignmentId).eq('question_id', questionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/assignments/${assignmentId}`)
  return { success: true }
}

// Trả về số câu available theo từng (skill, difficulty)
export async function getAvailableCountMatrix(excludeIds: string[]) {
  const admin = createAdminClient()
  let q = admin.from('questions').select('id, domain, skill, difficulty')
  if (excludeIds.length > 0)
    q = (q as any).not('id', 'in', `(${excludeIds.join(',')})`)
  const { data } = await q
  // Build map: `${skill}__${difficulty}` → count
  const matrix: Record<string, number> = {}
  for (const row of data ?? []) {
    const key = `${row.skill}__${row.difficulty}`
    matrix[key] = (matrix[key] ?? 0) + 1
  }
  return matrix
}

// config: mảng { skill, domain, easy, medium, hard }
export async function addRandomQuestionsToAssignment(
  assignmentId: string,
  config: Array<{ skill: string; domain: string; easy: number; medium: number; hard: number }>
) {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('assignment_questions').select('question_id').eq('assignment_id', assignmentId)
  const excludeIds = (existing ?? []).map((r: any) => r.question_id)

  const { data: maxPosRow } = await admin
    .from('assignment_questions').select('position')
    .eq('assignment_id', assignmentId).order('position', { ascending: false }).limit(1).maybeSingle()
  let pos = (maxPosRow?.position ?? -1) + 1

  const toInsert: Array<{ assignment_id: string; question_id: string; position: number }> = []
  const warnings: string[] = []

  for (const row of config) {
    const diffs: Array<{ diff: string; count: number }> = [
      { diff: 'Easy',   count: row.easy   },
      { diff: 'Medium', count: row.medium },
      { diff: 'Hard',   count: row.hard   },
    ].filter(d => d.count > 0)

    for (const { diff, count } of diffs) {
      let q = admin.from('questions').select('id')
        .eq('skill', row.skill).eq('difficulty', diff)
      if (excludeIds.length > 0)
        q = (q as any).not('id', 'in', `(${excludeIds.join(',')})`)

      const { data: pool } = await q
      if (!pool || pool.length === 0) {
        warnings.push(`${row.skill}/${diff}: không có câu`)
        continue
      }

      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const picked   = shuffled.slice(0, Math.min(count, shuffled.length))
      if (picked.length < count)
        warnings.push(`${row.skill}/${diff}: chỉ lấy được ${picked.length}/${count}`)

      for (const p of picked) {
        toInsert.push({ assignment_id: assignmentId, question_id: p.id, position: pos++ })
        excludeIds.push(p.id)
      }
    }
  }

  if (toInsert.length === 0) return { error: 'Không có câu hỏi nào phù hợp', count: 0 }

  const { error } = await admin.from('assignment_questions').insert(toInsert)
  if (error) return { error: error.message, count: 0 }

  revalidatePath(`/admin/assignments/${assignmentId}`)
  return { success: true, count: toInsert.length, warnings }
}

export async function updateAssignment(id: string, formData: FormData) {
  const admin = createAdminClient()
  const { error } = await admin.from('assignments').update({
    title:       formData.get('title')       as string,
    description: formData.get('description') as string || null,
    due_date:    formData.get('due_date')    as string || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/assignments')
  revalidatePath(`/admin/assignments/${id}`)
  return { success: true }
}

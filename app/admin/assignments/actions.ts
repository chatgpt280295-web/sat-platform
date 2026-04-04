'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createAssignment(formData: FormData) {
  const admin = createAdminClient()
  const { data, error } = await admin.from('assignments').insert({
    title:       formData.get('title')       as string,
    description: formData.get('description') as string || null,
    due_date:    formData.get('due_date')    as string || null,
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

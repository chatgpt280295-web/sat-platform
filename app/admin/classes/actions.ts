'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Tạo lớp mới ──────────────────────────────────────────────────
export async function createClass(formData: FormData) {
  const name        = formData.get('name')        as string
  const description = formData.get('description') as string
  const supabase    = await createClient()
  const { error }   = await supabase.from('classes').insert({ name, description })
  if (error) return { error: error.message }
  revalidatePath('/admin/classes')
  return { success: true }
}

// ── Xóa lớp ──────────────────────────────────────────────────────
export async function deleteClass(id: string) {
  const supabase  = await createClient()
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/classes')
  return { success: true }
}

// ── Thêm học sinh vào lớp ─────────────────────────────────────────
export async function addMember(classId: string, userId: string) {
  const supabase  = await createClient()
  const { error } = await supabase
    .from('class_members').insert({ class_id: classId, user_id: userId })
  if (error) return { error: error.message }
  revalidatePath('/admin/classes/' + classId)
  return { success: true }
}

// ── Xóa học sinh khỏi lớp ────────────────────────────────────────
export async function removeMember(classId: string, userId: string) {
  const supabase  = await createClient()
  const { error } = await supabase
    .from('class_members')
    .delete()
    .eq('class_id', classId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/classes/' + classId)
  return { success: true }
}

// ── Giao bài tập cho lớp ─────────────────────────────────────────
export async function addAssignmentToClass(classId: string, assignmentId: string) {
  const supabase  = await createClient()
  const { error } = await supabase
    .from('class_assignments').insert({ class_id: classId, assignment_id: assignmentId })
  if (error) return { error: error.message }
  revalidatePath('/admin/classes/' + classId)
  return { success: true }
}

// ── Gỡ bài tập khỏi lớp ──────────────────────────────────────────
export async function removeAssignmentFromClass(classId: string, assignmentId: string) {
  const supabase  = await createClient()
  const { error } = await supabase
    .from('class_assignments')
    .delete()
    .eq('class_id', classId)
    .eq('assignment_id', assignmentId)
  if (error) return { error: error.message }
  revalidatePath('/admin/classes/' + classId)
  return { success: true }
}

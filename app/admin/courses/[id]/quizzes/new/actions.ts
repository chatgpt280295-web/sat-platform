'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Chưa đăng nhập'
  const { data: profile } = await supabase
    .from('users').select('role').eq('auth_id', user.id).single()
  if (profile?.role !== 'admin') return 'Không có quyền truy cập'
  return null
}

export async function createAdminQuiz(courseId: string, formData: FormData) {
  const authErr = await requireAdmin()
  if (authErr) return { error: authErr }

  const admin = createAdminClient()

  const afterLessonId = formData.get('after_lesson_id') as string || null

  const { data, error } = await admin
    .from('assignments')
    .insert({
      title:           formData.get('title') as string,
      description:     formData.get('description') as string || null,
      course_id:       courseId,
      due_date:        formData.get('due_date') as string || null,
      passing_score:   parseInt(formData.get('passing_score') as string) || 70,
      quiz_type:       'quiz',
      after_lesson_id: afterLessonId,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/admin/assignments')
  return { id: data.id }
}

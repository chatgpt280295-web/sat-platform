'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createAdminQuiz(courseId: string, formData: FormData) {
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

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/admin/assignments')
  return data.id
}

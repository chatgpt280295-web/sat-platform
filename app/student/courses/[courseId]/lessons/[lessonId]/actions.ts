'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function markLessonComplete(userId: string, lessonId: string, courseId: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('lesson_progress')
    .upsert({ user_id: userId, lesson_id: lessonId, course_id: courseId }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true })

  if (error) throw new Error(error.message)
  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath(`/student/courses/${courseId}/lessons/${lessonId}`)
}

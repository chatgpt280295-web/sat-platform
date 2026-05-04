'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markLessonComplete(lessonId: string, courseId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) throw new Error('Không tìm thấy user')

  const admin = createAdminClient()
  const { error } = await admin
    .from('lesson_progress')
    .upsert(
      { user_id: profile.id, lesson_id: lessonId, course_id: courseId },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: true }
    )

  if (error) throw new Error(error.message)
  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath(`/student/courses/${courseId}/lessons/${lessonId}`)
}

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createContactRequest(courseId: string, sessionId: string, message: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) throw new Error('Không tìm thấy user')

  const admin = createAdminClient()
  const { error } = await admin.from('teacher_contact_requests').insert({
    user_id:    profile.id,
    course_id:  courseId,
    session_id: sessionId,
    message:    message.trim(),
    status:     'pending',
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/contacts')
}

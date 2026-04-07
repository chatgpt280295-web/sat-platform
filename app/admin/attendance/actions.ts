'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createSession(formData: FormData) {
  try {
    const admin      = createAdminClient()
    const classId    = formData.get('class_id')    as string
    const title      = formData.get('title')       as string
    const date       = formData.get('session_date') as string
    const opensAtRaw = formData.get('opens_at')    as string
    const windowMins = parseInt(formData.get('window_mins') as string || '10')

    if (!classId || !title || !date) return { error: 'Vui lòng điền đầy đủ thông tin' }

    const opensDate  = opensAtRaw ? new Date(opensAtRaw) : new Date()
    if (isNaN(opensDate.getTime())) return { error: 'Giờ mở điểm danh không hợp lệ' }
    const closesDate = new Date(opensDate.getTime() + windowMins * 60000)

    const { data, error } = await admin.from('class_sessions').insert({
      class_id: classId, title, session_date: date,
      opens_at: opensDate.toISOString(),
      closes_at: closesDate.toISOString(),
    }).select('id').single()

    if (error) return { error: error.message }
    if (!data) return { error: 'Không tạo được buổi học' }

    // Auto-create absent rows for all class members
    const { data: members } = await admin
      .from('class_members').select('user_id').eq('class_id', classId)
    if (members && members.length > 0) {
      await admin.from('attendances').insert(
        members.map((m: any) => ({ session_id: data.id, user_id: m.user_id, status: 'absent' }))
      )
    }

    revalidatePath('/admin/attendance')
    return { success: true, sessionId: data.id }
  } catch (err: any) {
    return { error: err.message ?? 'Lỗi không xác định' }
  }
}

export async function updateAttendanceStatus(sessionId: string, userId: string, status: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('attendances')
    .update({ status })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/attendance/' + sessionId)
  return { success: true }
}

export async function deleteSession(id: string) {
  const admin = createAdminClient()
  await admin.from('attendances').delete().eq('session_id', id)
  await admin.from('class_sessions').delete().eq('id', id)
  revalidatePath('/admin/attendance')
  return { success: true }
}

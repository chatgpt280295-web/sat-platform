'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createSession(formData: FormData) {
  const supabase   = await createClient()
  const classId    = formData.get('class_id')    as string
  const title      = formData.get('title')       as string
  const date       = formData.get('session_date') as string
  const opensAt    = formData.get('opens_at')    as string
  const windowMins = parseInt(formData.get('window_mins') as string || '10')

  const opensDate  = new Date(opensAt)
  const closesDate = new Date(opensDate.getTime() + windowMins * 60000)

  const { data, error } = await supabase.from('class_sessions').insert({
    class_id: classId, title, session_date: date,
    opens_at: opensDate.toISOString(),
    closes_at: closesDate.toISOString(),
  }).select('id').single()

  if (error) return { error: error.message }

  // Auto-create absent rows for all class members
  const { data: members } = await supabase
    .from('class_members').select('user_id').eq('class_id', classId)
  if (members && members.length > 0) {
    await supabase.from('attendances').insert(
      members.map(m => ({ session_id: data.id, user_id: m.user_id, status: 'absent' }))
    )
  }

  revalidatePath('/admin/attendance')
  return { success: true, sessionId: data.id }
}

export async function updateAttendanceStatus(
  sessionId: string, userId: string, status: string
) {
  const supabase = await createClient()
  const { error } = await supabase.from('attendances')
    .update({ status })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/attendance/' + sessionId)
  return { success: true }
}

export async function deleteSession(id: string) {
  const supabase = await createClient()
  await supabase.from('class_sessions').delete().eq('id', id)
  revalidatePath('/admin/attendance')
  return { success: true }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTempPassword } from '@/lib/utils'

export async function createStudent(formData: FormData) {
  const email     = formData.get('email')     as string
  const fullName  = formData.get('full_name') as string
  const courseId  = formData.get('course_id') as string
  const expiresAt = formData.get('expires_at') as string

  const admin = createAdminClient()
  const tempPassword = generateTempPassword()

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email, password: tempPassword, email_confirm: true,
  })
  if (authError) return { error: authError.message }

  const { error: profileError } = await admin.from('users').insert({
    auth_id: authUser.user.id,
    email, full_name: fullName,
    role: 'student', status: 'active',
  })
  if (profileError) return { error: profileError.message }

  if (courseId) {
    const { data: profile } = await admin
      .from('users').select('id').eq('auth_id', authUser.user.id).single()
    if (profile) {
      await admin.from('enrollments').insert({
        user_id: profile.id, course_id: courseId,
        expires_at: expiresAt || null,
      })
    }
  }

  revalidatePath('/admin/users')
  return { success: true, tempPassword }
}

export async function toggleUserStatus(userId: string, currentStatus: string) {
  const admin = createAdminClient()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  const { data: profile } = await admin.from('users').select('auth_id').eq('id', userId).single()
  const { error } = await admin.from('users').update({ status: newStatus }).eq('id', userId)
  if (error) return { error: error.message }
  if (newStatus === 'inactive' && profile?.auth_id) {
    try { await admin.auth.admin.updateUserById(profile.auth_id, { ban_duration: '876600h' }) } catch {}
  }
  if (newStatus === 'active' && profile?.auth_id) {
    try { await admin.auth.admin.updateUserById(profile.auth_id, { ban_duration: 'none' }) } catch {}
  }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteStudent(userId: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('auth_id').eq('id', userId).single()
  if (profile?.auth_id) {
    try { await admin.auth.admin.deleteUser(profile.auth_id) } catch {}
  }
  await admin.from('users').delete().eq('id', userId)
  revalidatePath('/admin/users')
  return { success: true }
}

// ── NEW: Admin resets student password ───────────────────────────────────────
export async function resetStudentPassword(userId: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    return { error: 'Mật khẩu phải có ít nhất 6 ký tự' }
  }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users').select('auth_id').eq('id', userId).single()
  if (!profile?.auth_id) return { error: 'Không tìm thấy học sinh' }

  const { error } = await admin.auth.admin.updateUserById(profile.auth_id, {
    password: newPassword,
  })
  if (error) return { error: error.message }
  return { success: true }
}

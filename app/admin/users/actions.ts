'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTempPassword } from '@/lib/utils'

// ── Tạo học sinh (hiển thị password trên UI) ─────────────────────
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

// ── Import học sinh từ CSV ────────────────────────────────────────
export async function importStudentsFromCSV(
  rows: { email: string; full_name: string; expires_at?: string }[]
): Promise<{ success: boolean; email: string; full_name: string; error?: string }[]> {
  const admin = createAdminClient()
  const results = []

  for (const row of rows) {
    try {
      const tempPassword = generateTempPassword()
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: row.email, password: tempPassword, email_confirm: true,
      })
      if (authError) {
        results.push({ success: false, email: row.email, full_name: row.full_name, error: authError.message })
        continue
      }
      const { error: profileError } = await admin.from('users').insert({
        auth_id: authUser.user.id,
        email: row.email, full_name: row.full_name,
        role: 'student', status: 'active',
      })
      if (profileError) {
        results.push({ success: false, email: row.email, full_name: row.full_name, error: profileError.message })
        continue
      }
      results.push({ success: true, email: row.email, full_name: row.full_name })
    } catch (e: any) {
      results.push({ success: false, email: row.email, full_name: row.full_name, error: e.message })
    }
  }

  revalidatePath('/admin/users')
  return results
}

// ── Bật/tắt trạng thái học sinh ──────────────────────────────────
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

// ── Xóa học sinh ─────────────────────────────────────────────────
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

// ── Admin đặt lại mật khẩu cho học sinh ──────────────────────────
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

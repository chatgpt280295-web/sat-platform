'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTempPassword } from '@/lib/utils'

export async function createStudent(formData: FormData) {
  const email     = formData.get('email')     as string
  const fullName  = formData.get('full_name') as string
  const courseId  = formData.get('course_id') as string

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

  revalidatePath('/admin/users')
  return { success: true, tempPassword }
}

export async function importStudentsFromCSV(
  rows: { email: string; full_name: string }[]
) {
  const admin = createAdminClient()
  const results = []
  for (const row of rows) {
    const tempPassword = generateTempPassword()
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: row.email, password: tempPassword, email_confirm: true,
    })
    if (authError) { results.push({ ...row, error: authError.message }); continue }
    await admin.from('users').insert({
      auth_id: authUser.user.id,
      email: row.email, full_name: row.full_name,
      role: 'student', status: 'active',
    })
    results.push({ success: true, email: row.email, full_name: row.full_name })
  }
  revalidatePath('/admin/users')
  return results
}

export async function toggleUserStatus(userId: string, currentStatus: string) {
  const admin = createAdminClient()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  const { error } = await admin.from('users').update({ status: newStatus }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteStudent(userId: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('auth_id').eq('id', userId).single()
  if (profile?.auth_id) await admin.auth.admin.deleteUser(profile.auth_id)
  await admin.from('users').delete().eq('id', userId)
  revalidatePath('/admin/users')
  return { success: true }
}

export async function resetStudentPassword(userId: string, newPassword: string) {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('auth_id').eq('id', userId).single()
  if (!profile?.auth_id) return { error: 'Không tìm thấy tài khoản' }
  const { error } = await admin.auth.admin.updateUserById(profile.auth_id, { password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

// BUG 2 FIX: Set student tier manually
export async function setStudentTier(userId: string, tier: number | null) {
  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ tier }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/users')
  return { success: true }
}

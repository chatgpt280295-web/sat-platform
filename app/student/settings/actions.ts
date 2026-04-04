'use server'

import { createClient } from '@/lib/supabase/server'

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  if (!newPassword || newPassword.length < 6) {
    return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }
  }
  if (currentPassword === newPassword) {
    return { error: 'Mật khẩu mới phải khác mật khẩu hiện tại' }
  }

  const supabase = await createClient()

  // Verify current password by re-signing in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Không xác định được người dùng' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { error: 'Mật khẩu hiện tại không đúng' }

  // Update to new password
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: true }
}

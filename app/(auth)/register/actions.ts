'use server'

// ── Imports ────────────────────────────────────────────────────────────────────
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Actions ────────────────────────────────────────────────────────────────────
export async function registerStudent(data: {
  fullName: string
  email: string
  password: string
}) {
  const adminSupabase = createAdminClient()

  // Tạo Supabase Auth user
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
      throw new Error('Email này đã được đăng ký. Vui lòng đăng nhập.')
    }
    throw new Error(authError.message)
  }

  // Tạo profile trong bảng users
  const { error: profileError } = await adminSupabase
    .from('users')
    .insert({
      auth_id:   authData.user.id,
      email:     data.email,
      full_name: data.fullName,
      role:      'student',
      status:    'active',
    })

  if (profileError) {
    // Rollback: xóa auth user nếu tạo profile thất bại
    await adminSupabase.auth.admin.deleteUser(authData.user.id)
    throw new Error('Không thể tạo tài khoản. Vui lòng thử lại.')
  }
}

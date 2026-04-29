'use server'

// ── Imports ────────────────────────────────────────────────────────────────────
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getMyUserId() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) throw new Error('Không tìm thấy user')
  return profile.id as string
}

// ── Cart actions ──────────────────────────────────────────────────────────────
export async function addToCart(courseId: string) {
  const userId   = await getMyUserId()
  const supabase = createAdminClient()

  // Kiểm tra đã enroll chưa
  const { data: enrolled } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (enrolled) throw new Error('Bạn đã sở hữu khóa học này')

  const { error } = await supabase
    .from('cart_items')
    .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id', ignoreDuplicates: true })

  if (error) throw new Error(error.message)
  revalidatePath('/student/cart')
}

export async function removeFromCart(courseId: string) {
  const userId   = await getMyUserId()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (error) throw new Error(error.message)
  revalidatePath('/student/cart')
}

export async function enrollFree(courseId: string) {
  const userId   = await getMyUserId()
  const supabase = createAdminClient()

  // Kiểm tra khóa học miễn phí
  const { data: course } = await supabase
    .from('courses')
    .select('price')
    .eq('id', courseId)
    .single()

  if (!course || (course.price && course.price > 0)) {
    throw new Error('Khóa học này không miễn phí')
  }

  const { error } = await supabase
    .from('enrollments')
    .upsert(
      { user_id: userId, course_id: courseId, enrolled_via: 'free' },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    )

  if (error) throw new Error(error.message)
  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath('/student/dashboard')
}

'use server'

// ── Imports ────────────────────────────────────────────────────────────────────
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Auth guard ────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')
  const { data: profile } = await supabase
    .from('users').select('role').eq('auth_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Không có quyền truy cập')
}

// ── Actions ────────────────────────────────────────────────────────────────────
export async function approveOrder(orderId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  // Lấy order và items
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .select('id, user_id, status, items:order_items(course_id, price)')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) throw new Error('Không tìm thấy đơn hàng')
  if (order.status !== 'pending') throw new Error('Đơn hàng đã được xử lý')

  const now = new Date().toISOString()

  // Cập nhật order status
  const { error: updateErr } = await admin
    .from('orders')
    .update({ status: 'paid', paid_at: now, updated_at: now })
    .eq('id', orderId)

  if (updateErr) throw new Error(updateErr.message)

  // Tạo enrollments cho từng course trong order
  const enrollments = (order.items as { course_id: string; price: number }[]).map(item => ({
    user_id:      order.user_id,
    course_id:    item.course_id,
    enrolled_via: 'purchase',
    paid_at:      now,
  }))

  if (enrollments.length > 0) {
    const { error: enrollErr } = await admin
      .from('enrollments')
      .upsert(enrollments, { onConflict: 'user_id,course_id', ignoreDuplicates: true })

    if (enrollErr) throw new Error(enrollErr.message)
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
}

export async function rejectOrder(orderId: string, note: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('orders')
    .update({
      status:     'cancelled',
      admin_note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
}

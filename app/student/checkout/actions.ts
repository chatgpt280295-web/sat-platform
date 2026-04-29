'use server'

// ── Imports ────────────────────────────────────────────────────────────────────
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Actions ────────────────────────────────────────────────────────────────────
export async function createOrder(paymentMethod: string = 'bank_transfer') {
  const supabase = await createServerClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) throw new Error('Không tìm thấy user')

  // Lấy cart items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('course_id, course:courses(id, name, price)')
    .eq('user_id', profile.id)

  if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng trống')

  const total = cartItems.reduce((sum, i) => sum + ((i.course as any)?.price ?? 0), 0)

  // Tạo order
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id:        profile.id,
      status:         'pending',
      total_price:    total,
      payment_method: paymentMethod,
    })
    .select('id')
    .single()

  if (orderErr || !order) throw new Error(orderErr?.message ?? 'Lỗi tạo đơn hàng')

  // Tạo order items
  const orderItems = cartItems.map(i => ({
    order_id:  order.id,
    course_id: i.course_id,
    price:     (i.course as any)?.price ?? 0,
  }))

  const { error: itemsErr } = await admin.from('order_items').insert(orderItems)
  if (itemsErr) throw new Error(itemsErr.message)

  // Xóa cart
  await admin.from('cart_items').delete().eq('user_id', profile.id)

  revalidatePath('/student/orders')
  revalidatePath('/student/cart')
  return order.id
}

export async function uploadPaymentProof(orderId: string, formData: FormData) {
  const supabase = await createServerClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')

  const file = formData.get('proof') as File
  if (!file || file.size === 0) throw new Error('Vui lòng chọn ảnh minh chứng')

  const fileName = `${orderId}-${Date.now()}.${file.name.split('.').pop()}`

  // Upload to Supabase Storage bucket 'payment-proofs'
  const { data: uploadData, error: uploadErr } = await admin.storage
    .from('payment-proofs')
    .upload(fileName, file, { cacheControl: '3600', upsert: true })

  if (uploadErr) throw new Error(uploadErr.message)

  const { data: { publicUrl } } = admin.storage
    .from('payment-proofs')
    .getPublicUrl(uploadData.path)

  // Cập nhật order với proof URL
  const { error: updateErr } = await admin
    .from('orders')
    .update({ payment_proof_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateErr) throw new Error(updateErr.message)
  revalidatePath(`/student/orders/${orderId}`)
}

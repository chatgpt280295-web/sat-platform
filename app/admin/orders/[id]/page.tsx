// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import OrderActions from './OrderActions'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, total_price, payment_method, payment_proof_url, admin_note, paid_at, created_at,
      user:users(id, full_name, email),
      items:order_items(id, price, course_id, course:courses(id, name, subject, level))
    `)
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const isPending = order.status === 'pending'

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Tất cả đơn hàng
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="page-title">Chi tiết đơn hàng</h1>
          <span className={`badge ${
            order.status === 'paid' ? 'badge-green' :
            order.status === 'pending' ? 'badge-yellow' : 'badge-red'
          }`}>
            {order.status === 'paid' ? '✓ Đã thanh toán' :
             order.status === 'pending' ? '⏳ Chờ duyệt' : '✗ Đã từ chối'}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">#{order.id.slice(0, 8).toUpperCase()} · {formatDateTime(order.created_at)}</p>
      </div>

      <div className="space-y-5">
        {/* Student info */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Thông tin học viên</h2>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-500">Họ tên:</span> <span className="font-medium">{(order.user as any)?.full_name}</span></div>
            <div><span className="text-gray-500">Email:</span> {(order.user as any)?.email}</div>
          </div>
        </div>

        {/* Order items */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Khóa học đặt mua</h2>
          <div className="space-y-2">
            {(order.items as any[]).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-medium text-sm text-gray-900">{item.course?.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{item.course?.subject} · Level {item.course?.level}</div>
                </div>
                <div className="font-semibold text-gray-900">{formatPrice(item.price)}</div>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-bold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-blue-700">{formatPrice(order.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Payment proof */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Minh chứng thanh toán</h2>
          <div className="text-sm text-gray-600 mb-3">
            Phương thức:{' '}
            <span className="font-medium">
              {order.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : order.payment_method}
            </span>
          </div>
          {order.payment_proof_url ? (
            <div>
              <img
                src={order.payment_proof_url}
                alt="Minh chứng thanh toán"
                className="max-w-sm rounded-xl border border-gray-200 shadow-sm"
              />
              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                Xem ảnh gốc
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <ImageIcon size={16} /> Chưa có minh chứng
            </div>
          )}
        </div>

        {/* Admin note */}
        {order.admin_note && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Ghi chú của admin</h2>
            <p className="text-sm text-gray-600">{order.admin_note}</p>
          </div>
        )}

        {/* Actions */}
        {isPending && (
          <OrderActions orderId={order.id} />
        )}

        {order.status === 'paid' && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={16} />
            Đơn hàng đã được duyệt {order.paid_at ? `lúc ${formatDateTime(order.paid_at)}` : ''}. Học viên đã được ghi danh.
          </div>
        )}
      </div>
    </div>
  )
}

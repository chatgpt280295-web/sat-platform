import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import PaymentProofUpload from './PaymentProofUpload'

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME            ?? 'Vietcombank'
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER  ?? '1234567890'
const BANK_OWNER   = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME    ?? 'SAT PLATFORM'

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', icon: Clock,        className: 'text-amber-600 bg-amber-50 border-amber-200' },
  paid:      { label: 'Đã thanh toán', icon: CheckCircle, className: 'text-green-600 bg-green-50 border-green-200' },
  cancelled: { label: 'Đã huỷ',        icon: XCircle,     className: 'text-red-600 bg-red-50 border-red-200' },
  refunded:  { label: 'Đã hoàn tiền',  icon: XCircle,     className: 'text-gray-600 bg-gray-50 border-gray-200' },
} as const

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, total_price, created_at, paid_at, payment_method,
      payment_proof_url, admin_note,
      order_items(id, course_id, price, course:courses(name, subject, level))
    `)
    .eq('id', params.orderId)
    .eq('user_id', profile.id)
    .single()

  if (!order) notFound()

  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon
  const items = (order.order_items ?? []) as any[]
  const isPending = order.status === 'pending'

  return (
    <div className="p-6 max-w-2xl">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/student/orders" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">Chi tiết đơn hàng</h1>
            <p className="page-subtitle text-xs font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Status banner */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${cfg.className}`}>
          <StatusIcon size={20} />
          <div>
            <div className="font-semibold">{cfg.label}</div>
            <div className="text-xs opacity-75">Đặt lúc {formatDate(order.created_at)}</div>
          </div>
          {order.paid_at && (
            <div className="ml-auto text-xs opacity-75">Thanh toán: {formatDate(order.paid_at)}</div>
          )}
        </div>

        {order.admin_note && (
          <div className="alert-error text-sm">
            <span className="font-semibold">Ghi chú từ admin:</span> {order.admin_note}
          </div>
        )}

        {/* Order items */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Khóa học đã mua</h2>
          <div className="space-y-3">
            {items.map((item: any, idx: number) => {
              const course = item.course
              const isMath = course?.subject === 'math'
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMath ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <BookOpen size={14} className={isMath ? 'text-blue-600' : 'text-purple-600'} />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{course?.name}</div>
                  </div>
                  <div className="font-semibold text-gray-900">{formatPrice(item.price)}</div>
                </div>
              )
            })}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
              <span>Tổng cộng</span>
              <span className="text-blue-700">{formatPrice(order.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Pending: bank transfer info + proof upload */}
        {isPending && (
          <>
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Thông tin chuyển khoản</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">Ngân hàng</span>
                  <span className="font-semibold text-gray-900">{BANK_NAME}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">Số tài khoản</span>
                  <span className="font-semibold text-gray-900 font-mono">{BANK_ACCOUNT}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">Chủ tài khoản</span>
                  <span className="font-semibold text-gray-900">{BANK_OWNER}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-gray-500">Số tiền</span>
                  <span className="font-bold text-blue-700 text-base">{formatPrice(order.total_price)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500">Nội dung CK</span>
                  <code className="font-mono text-sm bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-gray-900">
                    SAT {profile.full_name} {order.id.slice(0, 6).toUpperCase()}
                  </code>
                </div>
              </div>
            </div>

            <PaymentProofUpload orderId={order.id} existingProofUrl={order.payment_proof_url} />
          </>
        )}

        {/* Paid: show proof */}
        {order.status === 'paid' && order.payment_proof_url && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Minh chứng thanh toán</h2>
            <img src={order.payment_proof_url} alt="Payment proof"
              className="rounded-xl border border-gray-200 max-h-64 object-contain" />
          </div>
        )}

        {/* Paid: go to courses */}
        {order.status === 'paid' && (
          <Link href="/student/courses"
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors">
            Vào học ngay →
          </Link>
        )}
      </div>
    </div>
  )
}

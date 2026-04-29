import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShoppingBag, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', icon: Clock,         className: 'text-amber-600 bg-amber-50 border-amber-200' },
  paid:      { label: 'Đã thanh toán', icon: CheckCircle,  className: 'text-green-600 bg-green-50 border-green-200' },
  cancelled: { label: 'Đã huỷ',        icon: XCircle,      className: 'text-red-600 bg-red-50 border-red-200' },
  refunded:  { label: 'Đã hoàn tiền',  icon: XCircle,      className: 'text-gray-600 bg-gray-50 border-gray-200' },
} as const

export default async function OrdersPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/student/orders')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, status, total_price, created_at, paid_at, payment_method,
      order_items(course_id, price, course:courses(name, subject))
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const list = orders ?? []

  return (
    <div className="p-6 max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShoppingBag size={22} /> Đơn hàng của tôi
          </h1>
          <p className="page-subtitle">{list.length} đơn hàng</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-4">Chưa có đơn hàng nào</p>
          <Link href="/courses" className="btn-primary">Xem khóa học</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(order => {
            const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
            const StatusIcon = cfg.icon
            const items = (order.order_items ?? []) as any[]

            return (
              <Link key={order.id} href={`/student/orders/${order.id}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {items.map((i: any) => i.course?.name).filter(Boolean).join(', ')}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{items.length} khóa học</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-gray-900">{formatPrice(order.total_price)}</div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 ml-auto mt-1 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Chờ duyệt',     cls: 'badge-yellow', Icon: Clock        },
  paid:      { label: 'Đã thanh toán',  cls: 'badge-green',  Icon: CheckCircle  },
  cancelled: { label: 'Đã từ chối',    cls: 'badge-red',    Icon: XCircle      },
  refunded:  { label: 'Hoàn tiền',     cls: 'badge-gray',   Icon: XCircle      },
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createServerClient()
  const filter   = searchParams.status as string | undefined

  let query = supabase
    .from('orders')
    .select(`
      id, status, total_price, payment_method, created_at, paid_at,
      user:users(full_name, email),
      items:order_items(course_id, price, course:courses(name))
    `)
    .order('created_at', { ascending: false })

  if (filter && filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data: orders } = await query

  const counts = {
    all:       (orders?.length ?? 0),
    pending:   (orders ?? []).filter(o => o.status === 'pending').length,
    paid:      (orders ?? []).filter(o => o.status === 'paid').length,
    cancelled: (orders ?? []).filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đơn hàng</h1>
          <p className="page-subtitle">{counts.pending} đơn chờ duyệt</p>
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'paid', 'cancelled'] as const).map(s => (
          <Link key={s} href={`/admin/orders?status=${s}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (filter ?? 'all') === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s === 'all' ? 'Tất cả' :
             s === 'pending' ? 'Chờ duyệt' :
             s === 'paid' ? 'Đã thanh toán' : 'Từ chối'}
            <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
          </Link>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Khóa học</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Ngày đặt</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (orders ?? []).map((order: any) => {
                const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
                return (
                  <tr key={order.id}>
                    <td>
                      <div className="font-medium text-gray-900">{order.user?.full_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{order.user?.email}</div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-700">
                        {(order.items as any[]).map((item: any) => item.course?.name).join(', ')}
                      </div>
                    </td>
                    <td className="font-semibold">{formatPrice(order.total_price)}</td>
                    <td className="capitalize text-sm text-gray-600">
                      {order.payment_method === 'bank_transfer' ? 'Chuyển khoản' : order.payment_method}
                    </td>
                    <td className="text-sm text-gray-500">{formatDate(order.created_at)}</td>
                    <td>
                      <span className={cfg?.cls ?? 'badge-gray'}>
                        {cfg?.label ?? order.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Chi tiết <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

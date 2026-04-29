// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShoppingCart, Trash2, ArrowRight, BookOpen } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import RemoveFromCartBtn from './RemoveFromCartBtn'
import { addToCart } from './actions'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(price: number | null) {
  if (!price || price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CartPage({ searchParams }: { searchParams: { add?: string } }) {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/student/cart')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()

  if (!profile) redirect('/login')

  // Nếu có ?add=courseId thì thêm vào giỏ
  if (searchParams.add) {
    try { await addToCart(searchParams.add) } catch (_) {}
    redirect('/student/cart')
  }

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('id, course_id, added_at, course:courses(id, name, subject, level, price, thumbnail_url)')
    .eq('user_id', profile.id)
    .order('added_at', { ascending: false })

  const items   = cartItems ?? []
  const total   = items.reduce((sum, i) => sum + ((i.course as any)?.price ?? 0), 0)

  return (
    <div className="p-6 max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShoppingCart size={22} /> Giỏ hàng
          </h1>
          <p className="page-subtitle">{items.length} khóa học</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-4">Giỏ hàng trống</p>
          <Link href="/" className="btn-primary">Xem khóa học</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Items */}
          <div className="card divide-y divide-gray-50">
            {items.map(item => {
              const course = item.course as any
              const isMath = course?.subject === 'math'
              return (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${isMath ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    <BookOpen size={24} className={isMath ? 'text-blue-600' : 'text-purple-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{course?.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 capitalize">
                      {course?.subject === 'math' ? 'Toán SAT' : 'Tiếng Anh SAT'} · Level {course?.level}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`font-bold text-base ${isMath ? 'text-blue-700' : 'text-purple-700'}`}>
                      {formatPrice(course?.price)}
                    </span>
                    <RemoveFromCartBtn courseId={item.course_id} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Tổng cộng ({items.length} khóa học)</span>
              <span className="text-2xl font-bold text-gray-900">{formatPrice(total)}</span>
            </div>
            <Link href="/student/checkout"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base">
              Tiến hành thanh toán <ArrowRight size={18} />
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">
              Sau khi đặt hàng, admin sẽ xác nhận trong 24 giờ
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

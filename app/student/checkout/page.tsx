'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Copy, CheckCircle, Loader2, BookOpen, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createOrder } from './actions'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

// Bank info from env (public)
const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME    ?? 'Vietcombank'
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? '1234567890'
const BANK_OWNER   = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME   ?? 'SAT PLATFORM'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [userName, setUserName]   = useState('')
  const [copied, setCopied]       = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      const { data: profile } = await sb.from('users').select('id, full_name').eq('auth_id', user.id).single()
      if (!profile) return
      setUserName(profile.full_name)

      const { data: items } = await sb
        .from('cart_items')
        .select('course_id, course:courses(name, subject, level, price)')
        .eq('user_id', profile.id)

      if (!items || items.length === 0) {
        router.push('/student/cart')
        return
      }
      setCartItems(items)
    })
  }, [])

  const total           = cartItems.reduce((sum, i) => sum + ((i.course as any)?.price ?? 0), 0)
  const transferContent = userName ? `SAT ${userName} ${new Date().getFullYear()}` : ''

  function copyTransferContent() {
    navigator.clipboard.writeText(transferContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleOrder() {
    setError('')
    startTransition(async () => {
      try {
        const orderId = await createOrder('bank_transfer')
        router.push(`/student/orders/${orderId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi đặt hàng')
      }
    })
  }

  if (cartItems.length === 0) {
    return <div className="p-6 text-gray-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Đang tải...</div>
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <CreditCard size={22} /> Thanh toán
        </h1>
      </div>

      <div className="space-y-5">
        {/* Order summary */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>
          <div className="space-y-3">
            {cartItems.map((item, idx) => {
              const course = item.course as any
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${course?.subject === 'math' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <BookOpen size={14} className={course?.subject === 'math' ? 'text-blue-600' : 'text-purple-600'} />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{course?.name}</div>
                  </div>
                  <div className="font-semibold text-gray-900">{formatPrice(course?.price ?? 0)}</div>
                </div>
              )
            })}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
              <span>Tổng cộng</span>
              <span className="text-blue-700">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Bank transfer instructions */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Hướng dẫn chuyển khoản</h2>
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
            <div className="flex justify-between items-center py-2.5">
              <span className="text-gray-500">Số tiền</span>
              <span className="font-bold text-blue-700 text-base">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-800 mb-2">📝 Nội dung chuyển khoản quan trọng:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm bg-white border border-amber-200 px-3 py-2 rounded-lg text-gray-900">
                {transferContent}
              </code>
              <button onClick={copyTransferContent}
                className="shrink-0 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-medium">
                {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Đã copy' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="alert-warn text-sm">
          <div>
            <p className="font-semibold mb-1">📋 Quy trình xác nhận:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-700">
              <li>Nhấn "Đặt hàng" để tạo đơn</li>
              <li>Chuyển khoản theo thông tin trên</li>
              <li>Upload ảnh chụp màn hình xác nhận chuyển khoản</li>
              <li>Admin xác nhận trong vòng 24 giờ</li>
            </ol>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="flex gap-3">
          <button onClick={handleOrder} disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50">
            {isPending ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</> : 'Đặt hàng'}
          </button>
          <Link href="/student/cart" className="btn-secondary px-6">Quay lại</Link>
        </div>
      </div>
    </div>
  )
}

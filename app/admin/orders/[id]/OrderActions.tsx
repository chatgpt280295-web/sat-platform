'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { approveOrder, rejectOrder } from '../actions'

export default function OrderActions({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  function approve() {
    if (!confirm('Xác nhận duyệt đơn hàng này? Học viên sẽ được ghi danh ngay.')) return
    startTransition(async () => {
      try {
        await approveOrder(orderId)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi duyệt đơn')
      }
    })
  }

  function reject() {
    startTransition(async () => {
      try {
        await rejectOrder(orderId, note)
        setShowReject(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi từ chối đơn')
      }
    })
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Duyệt đơn hàng</h2>

      {error && <div className="alert-error mb-3">{error}</div>}

      {!showReject ? (
        <div className="flex gap-3">
          <button onClick={approve} disabled={isPending}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Duyệt thanh toán
          </button>
          <button onClick={() => setShowReject(true)} disabled={isPending}
            className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-5 py-2.5 rounded-xl transition-colors">
            <XCircle size={16} /> Từ chối
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label">Lý do từ chối (tùy chọn)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              className="input" placeholder="Minh chứng không hợp lệ..." />
          </div>
          <div className="flex gap-3">
            <button onClick={reject} disabled={isPending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Xác nhận từ chối
            </button>
            <button onClick={() => setShowReject(false)} className="btn-secondary">Hủy</button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition, useRef } from 'react'
import { Upload, CheckCircle, Loader2, ImageIcon } from 'lucide-react'
import { uploadPaymentProof } from '../../checkout/actions'

export default function PaymentProofUpload({
  orderId,
  existingProofUrl,
}: {
  orderId: string
  existingProofUrl: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [uploaded, setUploaded] = useState(!!existingProofUrl)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingProofUrl ?? null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setError('')

    const formData = new FormData()
    formData.append('proof', file)

    startTransition(async () => {
      try {
        await uploadPaymentProof(orderId, formData)
        setUploaded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi upload')
      }
    })
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Upload minh chứng thanh toán</h2>
      <p className="text-sm text-gray-500 mb-4">Chụp màn hình biên lai chuyển khoản và upload để admin xác nhận</p>

      {previewUrl && (
        <div className="mb-4 relative">
          <img src={previewUrl} alt="Preview" className="rounded-xl border border-gray-200 max-h-48 object-contain w-full" />
          {uploaded && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle size={11} /> Đã upload
            </div>
          )}
        </div>
      )}

      {!uploaded && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="w-full border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          {isPending
            ? <><Loader2 size={24} className="animate-spin" /><span className="text-sm">Đang upload...</span></>
            : <><ImageIcon size={24} /><span className="text-sm font-medium">Chọn ảnh minh chứng</span><span className="text-xs">JPG, PNG, WEBP · Tối đa 5MB</span></>
          }
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {uploaded && !isPending && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium mt-2">
          <CheckCircle size={16} /> Đã gửi minh chứng — admin sẽ xác nhận trong 24 giờ
        </div>
      )}

      {!uploaded && (
        <button onClick={() => inputRef.current?.click()} disabled={isPending}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm">
          <Upload size={16} /> Chọn ảnh
        </button>
      )}

      {error && <div className="mt-3 alert-error text-sm">{error}</div>}
    </div>
  )
}

'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createCourse } from '../actions'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewCoursePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const courseId = await createCourse(formData)
        router.push(`/admin/courses/${courseId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi tạo khóa học')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Quay lại
        </Link>
        <h1 className="page-title">Tạo khóa học mới</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Tên khóa học *</label>
            <input name="name" className="input" placeholder="Toán SAT Cơ Bản" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Môn học *</label>
              <select name="subject" className="input" required>
                <option value="">-- Chọn --</option>
                <option value="math">📐 Toán SAT</option>
                <option value="english">📝 Tiếng Anh SAT</option>
              </select>
            </div>
            <div>
              <label className="label">Cấp độ *</label>
              <select name="level" className="input" required>
                <option value="">-- Chọn --</option>
                <option value="1">Level 1 — Cơ Bản (200–450)</option>
                <option value="2">Level 2 — Trung Cấp (451–650)</option>
                <option value="3">Level 3 — Nâng Cao (651–800)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Giá (VNĐ)</label>
            <input name="price" type="number" min="0" step="50000" className="input" placeholder="1500000" defaultValue="0" />
            <p className="text-xs text-gray-400 mt-1">Để 0 nếu miễn phí</p>
          </div>

          <div>
            <label className="label">Thumbnail URL</label>
            <input name="thumbnail_url" type="url" className="input" placeholder="https://..." />
          </div>

          <div>
            <label className="label">Mô tả</label>
            <textarea name="description" className="input min-h-[100px] resize-y" placeholder="Mô tả ngắn về khóa học..." />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Đang tạo...</> : 'Tạo khóa học'}
            </button>
            <Link href="/admin/courses" className="btn-secondary">Hủy</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

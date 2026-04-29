'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { updateCourse } from '../../actions'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EditCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [course, setCourse] = useState<any>(null)

  useEffect(() => {
    createClient()
      .from('courses')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data }) => setCourse(data))
  }, [params.id])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await updateCourse(params.id, formData)
        router.push(`/admin/courses/${params.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật')
      }
    })
  }

  if (!course) return <div className="p-6 text-gray-400">Đang tải...</div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/courses/${params.id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Quay lại
        </Link>
        <h1 className="page-title">Chỉnh sửa khóa học</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Tên khóa học *</label>
            <input name="name" className="input" defaultValue={course.name} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Môn học *</label>
              <select name="subject" className="input" defaultValue={course.subject ?? ''} required>
                <option value="">-- Chọn --</option>
                <option value="math">📐 Toán SAT</option>
                <option value="english">📝 Tiếng Anh SAT</option>
              </select>
            </div>
            <div>
              <label className="label">Cấp độ *</label>
              <select name="level" className="input" defaultValue={course.level ?? ''} required>
                <option value="">-- Chọn --</option>
                <option value="1">Level 1 — Cơ Bản</option>
                <option value="2">Level 2 — Trung Cấp</option>
                <option value="3">Level 3 — Nâng Cao</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Giá (VNĐ)</label>
            <input name="price" type="number" min="0" step="50000" className="input" defaultValue={course.price ?? 0} />
          </div>

          <div>
            <label className="label">Thumbnail URL</label>
            <input name="thumbnail_url" type="url" className="input" defaultValue={course.thumbnail_url ?? ''} />
          </div>

          <div>
            <label className="label">Mô tả</label>
            <textarea name="description" className="input min-h-[100px] resize-y" defaultValue={course.description ?? ''} />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Đang lưu...</> : 'Lưu thay đổi'}
            </button>
            <Link href={`/admin/courses/${params.id}`} className="btn-secondary">Hủy</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

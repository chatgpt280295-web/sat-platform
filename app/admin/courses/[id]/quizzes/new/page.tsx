'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, ClipboardList } from 'lucide-react'
import { createAdminQuiz } from './actions'
import { Suspense } from 'react'

// ── Inner form (needs useSearchParams → must be inside Suspense) ──────────────
function NewQuizForm({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const afterLessonId    = searchParams.get('after') ?? ''
  const afterLessonTitle = searchParams.get('afterTitle') ?? ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    if (afterLessonId) formData.set('after_lesson_id', afterLessonId)

    startTransition(async () => {
      try {
        const quizId = await createAdminQuiz(params.id, formData)
        router.push(`/admin/assignments/${quizId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi tạo quiz')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/courses/${params.id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Quay lại khóa học
        </Link>
        <h1 className="page-title">Tạo Quiz mới</h1>
        <p className="page-subtitle">
          {afterLessonTitle
            ? <>Gắn sau bài: <strong>{afterLessonTitle}</strong></>
            : 'Quiz độc lập (không gắn với bài học cụ thể)'}
        </p>
      </div>

      <div className="card p-6">
        {afterLessonTitle && (
          <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl mb-5 text-sm text-purple-700">
            <ClipboardList size={15} />
            Quiz này sẽ xuất hiện ngay sau khi học viên xem xong bài <strong>{afterLessonTitle}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Tiêu đề quiz *</label>
            <input name="title" className="input" placeholder="Quiz sau bài học 1" required />
          </div>

          <div>
            <label className="label">Mô tả</label>
            <textarea name="description" className="input min-h-[80px] resize-y"
              placeholder="Quiz kiểm tra nội dung bài học vừa xem..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Điểm đạt (%)</label>
              <input name="passing_score" type="number" min="0" max="100" className="input" defaultValue="70" />
              <p className="text-xs text-gray-400 mt-1">Học viên cần đạt để qua</p>
            </div>
            <div>
              <label className="label">Hạn nộp</label>
              <input name="due_date" type="datetime-local" className="input" />
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="alert-warn text-sm">
            Sau khi tạo, bạn sẽ được chuyển đến trang quản lý quiz để thêm câu hỏi.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Đang tạo...</> : 'Tạo quiz'}
            </button>
            <Link href={`/admin/courses/${params.id}`} className="btn-secondary">Hủy</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page wrapper (Suspense required for useSearchParams) ──────────────────────
export default function NewQuizPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Đang tải...</div>}>
      <NewQuizForm params={params} />
    </Suspense>
  )
}

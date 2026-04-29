'use client'

// ── Types & Imports ────────────────────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAssignment } from '../actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  courses: { id: string; name: string; subject: string | null }[]
}

// ── Render ─────────────────────────────────────────────────────────────────────
export default function NewAssignmentForm({ courses }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [error, setError]  = useState('')
  const [form, setForm]    = useState({
    title: '', description: '', due_date: '', course_id: '', passing_score: '70',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.set(k, v) })
    start(async () => {
      const res = await createAssignment(fd)
      if (res.error) { setError(res.error); return }
      router.push(`/admin/assignments/${res.id}`)
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="page-header">
        <div>
          <Link href="/admin/assignments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-1">
            <ArrowLeft size={14}/> Quay lại
          </Link>
          <h1 className="page-title">Tạo bài tập mới</h1>
        </div>
      </div>

      {error && <div className="alert-error mb-5">{error}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Tên bài tập *</label>
              <input className="input" placeholder="VD: Bài tập Algebra tuần 1"
                value={form.title} onChange={e => set('title', e.target.value)} required/>
            </div>

            <div>
              <label className="label">Khóa học</label>
              <select className="input" value={form.course_id} onChange={e => set('course_id', e.target.value)}>
                <option value="">— Chọn khóa học (tuỳ chọn) —</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Gắn bài tập với khóa học để học viên ghi danh có thể thấy</p>
            </div>

            <div>
              <label className="label">Điểm đạt (%)</label>
              <input className="input" type="number" min="0" max="100"
                value={form.passing_score} onChange={e => set('passing_score', e.target.value)}/>
              <p className="text-xs text-gray-400 mt-1">Điểm tối thiểu để coi là đạt (mặc định 70%)</p>
            </div>

            <div>
              <label className="label">Mô tả</label>
              <textarea className="input" rows={3}
                placeholder="Mô tả ngắn về bài tập này (tuỳ chọn)"
                value={form.description} onChange={e => set('description', e.target.value)}/>
            </div>

            <div>
              <label className="label">Hạn nộp</label>
              <input className="input" type="datetime-local"
                value={form.due_date} onChange={e => set('due_date', e.target.value)}/>
              <p className="text-xs text-gray-400 mt-1">Để trống nếu không có hạn cụ thể</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/assignments" className="btn-secondary flex-1 justify-center">Huỷ</Link>
              <button type="submit" disabled={isPending} className="btn-primary flex-1 justify-center">
                {isPending ? 'Đang tạo…' : 'Tạo & thêm câu hỏi →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

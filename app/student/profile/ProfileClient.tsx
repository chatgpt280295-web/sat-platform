'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from './actions'
import { Check, Pencil, X } from 'lucide-react'

interface Survey {
  school?: string | null
  grade?: string | null
  english_level?: string | null
  sat_target?: number | null
  hours_per_week?: number | null
  strengths?: string | null
}

interface Props {
  fullName: string
  survey: Survey | null
}

const ENGLISH_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const ENGLISH_LABELS: Record<string, string> = {
  A1: 'A1 — Beginner', A2: 'A2 — Elementary',
  B1: 'B1 — Intermediate', B2: 'B2 — Upper-Intermediate',
  C1: 'C1 — Advanced', C2: 'C2 — Proficient',
}
const GRADES         = ['Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đã tốt nghiệp', 'Khác']

export default function ProfileClient({ fullName, survey }: Props) {
  const [editing, setEditing]     = useState(false)
  const [isPending, start]        = useTransition()
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')

  const [form, setForm] = useState({
    full_name:      fullName,
    school:         survey?.school         ?? '',
    grade:          survey?.grade          ?? '',
    english_level:  survey?.english_level  ?? '',
    sat_target:     survey?.sat_target?.toString()     ?? '',
    hours_per_week: survey?.hours_per_week?.toString() ?? '',
    strengths:      survey?.strengths      ?? '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.set(k, v) })
    start(() => {
      updateProfile(fd).then((res) => {
        if (res.error) { setError(res.error); return }
        setSuccess(true)
        setEditing(false)
        setTimeout(() => setSuccess(false), 3000)
      })
    })
  }

  return (
    <div>
      {/* Success toast */}
      {success && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          <Check size={15} /> Đã lưu thông tin thành công!
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Thông tin cá nhân ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Thông tin cá nhân</h2>
            {!editing && (
              <button type="button" onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
                <Pencil size={13} /> Chỉnh sửa
              </button>
            )}
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                Họ và tên
              </label>
              {editing ? (
                <input className="input"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              ) : (
                <p className="text-sm font-medium text-gray-900">{form.full_name || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                Trường học
              </label>
              {editing ? (
                <input className="input"
                  placeholder="VD: THPT Nguyễn Du"
                  value={form.school} onChange={e => set('school', e.target.value)} />
              ) : (
                <p className="text-sm text-gray-700">{form.school || <span className="text-gray-400">Chưa cập nhật</span>}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                Năm học / Lớp
              </label>
              {editing ? (
                <select className="input"
                  value={form.grade} onChange={e => set('grade', e.target.value)}>
                  <option value="">Chọn năm học</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <p className="text-sm text-gray-700">{form.grade || <span className="text-gray-400">Chưa cập nhật</span>}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                Trình độ tiếng Anh
              </label>
              {editing ? (
                <select className="input"
                  value={form.english_level} onChange={e => set('english_level', e.target.value)}>
                  <option value="">Chọn trình độ</option>
                  {ENGLISH_LEVELS.map(l => <option key={l} value={l}>{ENGLISH_LABELS[l]}</option>)}
                </select>
              ) : (
                <p className="text-sm text-gray-700">{form.english_level ? (ENGLISH_LABELS[form.english_level] ?? form.english_level) : <span className="text-gray-400">Chưa cập nhật</span>}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Mục tiêu học tập ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Mục tiêu học tập</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                Điểm SAT mục tiêu
              </label>
              {editing ? (
                <div className="relative">
                  <input type="number" min={400} max={1600} step={10}
                    className="input pr-16"
                    placeholder="VD: 1400"
                    value={form.sat_target} onChange={e => set('sat_target', e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/ 1600</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {form.sat_target
                    ? <><span className="text-2xl font-bold text-blue-700">{form.sat_target}</span><span className="text-gray-400 text-xs ml-1">/ 1600</span></>
                    : <span className="text-gray-400">Chưa cập nhật</span>}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                Số giờ học mỗi tuần
              </label>
              {editing ? (
                <div className="relative">
                  <input type="number" min={1} max={40}
                    className="input pr-16"
                    placeholder="VD: 10"
                    value={form.hours_per_week} onChange={e => set('hours_per_week', e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">giờ</span>
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  {form.hours_per_week
                    ? <><span className="text-2xl font-bold text-green-700">{form.hours_per_week}</span><span className="text-gray-400 text-xs ml-1">giờ / tuần</span></>
                    : <span className="text-gray-400">Chưa cập nhật</span>}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                Điểm mạnh / Ghi chú bản thân
              </label>
              {editing ? (
                <textarea rows={3}
                  className="input resize-none"
                  placeholder="VD: Tôi giỏi phần Grammar nhưng cần cải thiện Reading..."
                  value={form.strengths} onChange={e => set('strengths', e.target.value)} />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {form.strengths || <span className="text-gray-400">Chưa cập nhật</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {editing && (
          <div className="flex gap-3">
            <button type="button" onClick={() => { setEditing(false); setError('') }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <X size={15} /> Huỷ
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
              <Check size={15} /> {isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

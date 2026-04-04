'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createQuestion } from '../actions'
import { MATH_SKILLS, RW_SKILLS } from '@/types'
import { KaTeXPreview } from '@/components/math/KaTeX'
import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

const DOMAINS     = ['Math', 'Reading & Writing'] as const
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']    as const
const ANSWERS     = ['A', 'B', 'C', 'D']           as const

export default function NewQuestionPage() {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [error, setError]  = useState('')
  const [preview, setPreview] = useState(false)
  const [form, setForm] = useState({
    domain: 'Math', skill: '', difficulty: 'Medium', source: '',
    content: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'A', explanation: '',
  })

  const skills = form.domain === 'Math' ? [...MATH_SKILLS] : [...RW_SKILLS]
  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v, ...(k === 'domain' ? { skill: '' } : {}) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.skill) { setError('Vui lòng chọn Skill'); return }
    setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.set(k, v))
    start(async () => {
      const res = await createQuestion(fd)
      if (res.error) { setError(res.error); return }
      router.push('/admin/questions')
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header">
        <div>
          <Link href="/admin/questions" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-1">
            <ArrowLeft size={14}/> Quay lại
          </Link>
          <h1 className="page-title">Thêm câu hỏi mới</h1>
        </div>
        <button type="button" onClick={() => setPreview(p => !p)}
          className={preview ? 'btn-primary' : 'btn-secondary'}>
          <Eye size={15}/> {preview ? 'Ẩn preview' : 'Xem preview'}
        </button>
      </div>

      {error && <div className="alert-error mb-5">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={`grid gap-5 ${preview ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="space-y-5">
            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold">Phân loại</h2></div>
              <div className="card-body grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Domain *</label>
                  <select className="input" value={form.domain} onChange={e => set('domain', e.target.value)}>
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Skill *</label>
                  <select className="input" value={form.skill} onChange={e => set('skill', e.target.value)} required>
                    <option value="">Chọn skill</option>
                    {skills.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Độ khó *</label>
                  <select className="input" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="label">Nguồn</label>
                  <input className="input" placeholder="VD: SAT Practice Test 1, Q5"
                    value={form.source} onChange={e => set('source', e.target.value)}/>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold">Nội dung câu hỏi</h2></div>
              <div className="card-body">
                <textarea className="input font-mono text-sm" rows={5}
                  placeholder="Nhập nội dung. Dùng $...$ cho inline math, $$...$$ cho display math."
                  value={form.content} onChange={e => set('content', e.target.value)} required/>
                <p className="text-xs text-gray-400 mt-1">Hỗ trợ LaTeX: $x^2$ hoặc $$\frac{'{a}'}{'{b}'}$$</p>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold">Đáp án</h2></div>
              <div className="card-body space-y-3">
                {ANSWERS.map(letter => (
                  <div key={letter} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      form.correct_answer === letter ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>{letter}</div>
                    <input className="input flex-1 text-sm"
                      placeholder={`Đáp án ${letter}`}
                      value={(form as any)[`option_${letter.toLowerCase()}`]}
                      onChange={e => set(`option_${letter.toLowerCase()}`, e.target.value)} required/>
                    <button type="button" onClick={() => set('correct_answer', letter)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                        form.correct_answer === letter
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}>
                      {form.correct_answer === letter ? '✓ Đúng' : 'Đúng'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h2 className="text-sm font-semibold">Giải thích (tuỳ chọn)</h2></div>
              <div className="card-body">
                <textarea className="input font-mono text-sm" rows={3}
                  placeholder="Giải thích đáp án đúng…"
                  value={form.explanation} onChange={e => set('explanation', e.target.value)}/>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/admin/questions" className="btn-secondary flex-1 justify-center">Huỷ</Link>
              <button type="submit" disabled={isPending} className="btn-primary flex-1 justify-center">
                {isPending ? 'Đang lưu…' : 'Lưu câu hỏi'}
              </button>
            </div>
          </div>

          {preview && (
            <div className="space-y-4">
              <div className="card sticky top-4">
                <div className="card-header"><h2 className="text-sm font-semibold text-blue-700">Preview</h2></div>
                <div className="card-body space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Đề bài</p>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm leading-relaxed">
                      <KaTeXPreview text={form.content || 'Nội dung sẽ hiển thị ở đây…'}/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Đáp án</p>
                    {ANSWERS.map(letter => (
                      <div key={letter}
                        className={`flex items-start gap-2.5 p-3 rounded-xl text-sm ${
                          form.correct_answer === letter ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                        }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          form.correct_answer === letter ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>{letter}</span>
                        <KaTeXPreview text={(form as any)[`option_${letter.toLowerCase()}`] || '—'}/>
                      </div>
                    ))}
                  </div>
                  {form.explanation && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-blue-700 mb-1">Giải thích</p>
                      <div className="text-sm text-blue-800"><KaTeXPreview text={form.explanation}/></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

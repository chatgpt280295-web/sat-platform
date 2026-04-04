'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { MATH_SKILLS, RW_SKILLS } from '@/types'
import Link from 'next/link'
import { Plus, Upload, Search, BookOpen } from 'lucide-react'
import QuestionImportModal from './QuestionImportModal'
import QuestionDeleteBtn from './QuestionDeleteBtn'

const PAGE_SIZE = 20

export default function AdminQuestionsPage() {
  const [questions, setQuestions]     = useState<any[]>([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(0)
  const [loading, setLoading]         = useState(true)
  const [showImport, setShowImport]   = useState(false)
  const [domain, setDomain]           = useState('')
  const [skill, setSkill]             = useState('')
  const [difficulty, setDifficulty]   = useState('')
  const [search, setSearch]           = useState('')

  const domainSkills = domain === 'Math' ? [...MATH_SKILLS] : domain === 'Reading & Writing' ? [...RW_SKILLS] : []

  async function load() {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('questions')
      .select('id, domain, skill, difficulty, source, content, correct_answer, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (domain)     q = (q as any).eq('domain', domain)
    if (skill)      q = (q as any).eq('skill', skill)
    if (difficulty) q = (q as any).eq('difficulty', difficulty)
    if (search.trim()) q = (q as any).ilike('content', `%${search}%`)
    const { data, count } = await q
    setQuestions(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, domain, skill, difficulty, search])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const diffColor: Record<string, string> = {
    Easy: 'badge-green', Medium: 'badge-yellow', Hard: 'badge-red',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p className="page-subtitle">{total.toLocaleString()} câu hỏi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary"><Upload size={15}/> Nhập CSV</button>
          <Link href="/admin/questions/new" className="btn-primary"><Plus size={15}/> Thêm câu hỏi</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9 w-56" placeholder="Tìm trong nội dung…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}/>
        </div>
        <select className="input w-44" value={domain} onChange={e => { setDomain(e.target.value); setSkill(''); setPage(0) }}>
          <option value="">Tất cả domain</option>
          <option value="Math">Math</option>
          <option value="Reading & Writing">Reading &amp; Writing</option>
        </select>
        {domainSkills.length > 0 && (
          <select className="input w-56" value={skill} onChange={e => { setSkill(e.target.value); setPage(0) }}>
            <option value="">Tất cả skill</option>
            {domainSkills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select className="input w-36" value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(0) }}>
          <option value="">Tất cả độ khó</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        {(domain || skill || difficulty || search) && (
          <button className="btn-secondary text-xs"
            onClick={() => { setDomain(''); setSkill(''); setDifficulty(''); setSearch(''); setPage(0) }}>
            Xoá filter
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">#</th><th>Nội dung</th><th>Domain</th>
                <th>Skill</th><th>Độ khó</th><th>Đáp án</th><th>Ngày tạo</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Đang tải…</td></tr>
              ) : questions.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state py-16">
                    <BookOpen size={40} className="text-gray-200 mb-3"/>
                    <p className="text-gray-400">Chưa có câu hỏi nào</p>
                    <Link href="/admin/questions/new" className="btn-primary mt-4 text-sm">
                      <Plus size={14}/> Thêm câu hỏi đầu tiên
                    </Link>
                  </div>
                </td></tr>
              ) : questions.map((q, idx) => (
                <tr key={q.id}>
                  <td className="text-gray-400 text-xs tabular-nums">{page * PAGE_SIZE + idx + 1}</td>
                  <td className="max-w-xs">
                    <p className="text-sm text-gray-800 truncate">{q.content.slice(0, 80)}{q.content.length > 80 ? '…' : ''}</p>
                    {q.source && <p className="text-xs text-gray-400 mt-0.5">{q.source}</p>}
                  </td>
                  <td><span className="badge badge-blue text-xs">{q.domain === 'Math' ? 'Math' : 'R&W'}</span></td>
                  <td className="text-xs text-gray-600 max-w-[140px] truncate">{q.skill}</td>
                  <td><span className={`badge ${diffColor[q.difficulty] ?? ''}`}>{q.difficulty}</span></td>
                  <td><span className="font-bold text-blue-600">{q.correct_answer}</span></td>
                  <td className="text-xs text-gray-400">{formatDate(q.created_at)}</td>
                  <td><QuestionDeleteBtn id={q.id} onDone={load}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Trang {page+1}/{totalPages} — {total} câu hỏi</span>
            <div className="flex gap-1.5">
              <button disabled={page === 0} onClick={() => setPage(p => p-1)} className="btn-secondary text-xs px-3 py-1.5">← Trước</button>
              <button disabled={page >= totalPages-1} onClick={() => setPage(p => p+1)} className="btn-secondary text-xs px-3 py-1.5">Tiếp →</button>
            </div>
          </div>
        )}
      </div>
      {showImport && <QuestionImportModal onClose={() => { setShowImport(false); load() }}/>}
    </div>
  )
}

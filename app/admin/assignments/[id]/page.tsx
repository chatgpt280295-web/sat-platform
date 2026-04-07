'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { addQuestionToAssignment, removeQuestionFromAssignment, updateAssignment } from '../actions'
import { ArrowLeft, Plus, Trash2, Search, Save, Shuffle } from 'lucide-react'
import RandomQuestionsTab from './RandomQuestionsTab'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { MATH_SKILLS, RW_SKILLS } from '@/types'

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [isPending, start] = useTransition()

  const [assignment, setAssignment]   = useState<any>(null)
  const [aqList, setAqList]           = useState<any[]>([])   // questions in assignment
  const [bankQuestions, setBankQ]     = useState<any[]>([])
  const [search, setSearch]           = useState('')
  const [domain, setDomain]           = useState('')
  const [difficulty, setDifficulty]   = useState('')
  const [tab, setTab]                 = useState<'questions'|'add'|'random'>('questions')
  const [editing, setEditing]         = useState(false)
  const [form, setForm]               = useState({ title: '', description: '', due_date: '' })
  const [error, setError]             = useState('')
  const [msg, setMsg]                 = useState('')

  async function loadAssignment() {
    const supabase = createClient()
    const { data } = await supabase
      .from('assignments').select('*').eq('id', id).single()
    if (data) {
      setAssignment(data)
      setForm({ title: data.title, description: data.description ?? '', due_date: data.due_date ? data.due_date.slice(0,16) : '' })
    }
  }

  async function loadAQ() {
    const supabase = createClient()
    const { data } = await supabase
      .from('assignment_questions')
      .select('position, questions(id, domain, skill, difficulty, content, correct_answer)')
      .eq('assignment_id', id)
      .order('position')
    setAqList(data ?? [])
  }

  async function loadBank() {
    const supabase = createClient()
    let q = supabase.from('questions')
      .select('id, domain, skill, difficulty, content, correct_answer')
      .order('created_at', { ascending: false })
      .limit(50)
    if (domain)   q = (q as any).eq('domain', domain)
    if (difficulty) q = (q as any).eq('difficulty', difficulty)
    if (search.trim()) q = (q as any).ilike('content', `%${search}%`)
    const { data } = await q
    setBankQ(data ?? [])
  }

  useEffect(() => { loadAssignment(); loadAQ() }, [id])
  useEffect(() => { if (tab === 'add') loadBank() }, [tab, domain, difficulty, search])

  const addedIds = new Set(aqList.map(aq => aq.questions?.id))

  async function handleAdd(questionId: string) {
    const res = await addQuestionToAssignment(id, questionId)
    if (res.error) { setError(res.error); return }
    loadAQ()
  }

  async function handleRemove(questionId: string) {
    await removeQuestionFromAssignment(id, questionId)
    loadAQ()
  }

  async function handleSave() {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.set(k, v) })
    start(async () => {
      const res = await updateAssignment(id, fd)
      if (res.error) { setError(res.error); return }
      setEditing(false); setMsg('Đã lưu!'); loadAssignment()
      setTimeout(() => setMsg(''), 2000)
    })
  }

  const diffColor: Record<string,string> = { Easy:'badge-green', Medium:'badge-yellow', Hard:'badge-red' }

  if (!assignment) return <div className="p-6 text-gray-400">Đang tải…</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href="/admin/assignments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-1">
            <ArrowLeft size={14}/> Quay lại
          </Link>
          {editing ? (
            <input className="input text-xl font-bold border-blue-300" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
          ) : (
            <h1 className="page-title">{assignment.title}</h1>
          )}
          <p className="page-subtitle">{aqList.length} câu hỏi</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn-secondary">Huỷ</button>
              <button onClick={handleSave} disabled={isPending} className="btn-primary">
                <Save size={15}/> {isPending ? 'Đang lưu…' : 'Lưu'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-secondary">Chỉnh sửa</button>
          )}
        </div>
      </div>

      {error && <div className="alert-error mb-4">{error}</div>}
      {msg   && <div className="alert-success mb-4">{msg}</div>}

      {/* Edit fields */}
      {editing && (
        <div className="card mb-5">
          <div className="card-body grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mô tả</label>
              <textarea className="input" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
            </div>
            <div>
              <label className="label">Hạn nộp</label>
              <input className="input" type="datetime-local" value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}/>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'questions', label: `Câu hỏi trong bài (${aqList.length})` },
          { key: 'add',       label: '+ Thêm thủ công' },
          { key: 'random',    label: '🎲 Tạo ngẫu nhiên' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Questions in assignment */}
      {tab === 'questions' && (
        <div className="card">
          {aqList.length === 0 ? (
            <div className="empty-state py-16">
              <p className="text-gray-400">Chưa có câu hỏi nào.</p>
              <button onClick={() => setTab('add')} className="btn-primary mt-4">
                <Plus size={15}/> Thêm câu hỏi
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th className="w-10">#</th><th>Nội dung</th><th>Domain</th><th>Độ khó</th><th>Đáp án</th><th></th></tr>
                </thead>
                <tbody>
                  {aqList.map((aq, i) => {
                    const q = aq.questions
                    return (
                      <tr key={q?.id}>
                        <td className="text-gray-400 text-xs">{i + 1}</td>
                        <td className="max-w-xs">
                          <p className="text-sm text-gray-800 truncate">{q?.content?.slice(0, 80)}…</p>
                        </td>
                        <td><span className="badge badge-blue text-xs">{q?.domain === 'Math' ? 'Math' : 'R&W'}</span></td>
                        <td><span className={`badge ${diffColor[q?.difficulty] ?? ''}`}>{q?.difficulty}</span></td>
                        <td><span className="font-bold text-blue-600">{q?.correct_answer}</span></td>
                        <td>
                          <button onClick={() => handleRemove(q?.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14}/>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Random questions */}
      {tab === 'random' && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-5">
              <Shuffle size={18} className="text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Tạo bài tập ngẫu nhiên</h3>
                <p className="text-xs text-gray-400 mt-0.5">Hệ thống sẽ chọn ngẫu nhiên câu hỏi từ ngân hàng theo cấu hình bên dưới</p>
              </div>
            </div>
            <RandomQuestionsTab
              assignmentId={id}
              existingIds={aqList.map(aq => aq.questions?.id).filter(Boolean)}
              onDone={() => { loadAQ(); setTab('questions') }}
            />
          </div>
        </div>
      )}

      {/* Tab: Add from bank */}
      {tab === 'add' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input pl-9" placeholder="Tìm câu hỏi…"
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <select className="input w-44" value={domain} onChange={e => { setDomain(e.target.value) }}>
              <option value="">Tất cả domain</option>
              <option value="Math">Math</option>
              <option value="Reading & Writing">Reading &amp; Writing</option>
            </select>
            <select className="input w-36" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="">Tất cả độ khó</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Nội dung</th><th>Domain</th><th>Skill</th><th>Độ khó</th><th></th></tr>
                </thead>
                <tbody>
                  {bankQuestions.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">Không tìm thấy câu hỏi</td></tr>
                  ) : bankQuestions.map(q => {
                    const already = addedIds.has(q.id)
                    return (
                      <tr key={q.id}>
                        <td className="max-w-xs">
                          <p className="text-sm text-gray-800 truncate">{q.content?.slice(0, 70)}…</p>
                        </td>
                        <td><span className="badge badge-blue text-xs">{q.domain === 'Math' ? 'Math' : 'R&W'}</span></td>
                        <td className="text-xs text-gray-500 max-w-[130px] truncate">{q.skill}</td>
                        <td><span className={`badge ${diffColor[q.difficulty] ?? ''}`}>{q.difficulty}</span></td>
                        <td>
                          {already ? (
                            <span className="text-xs text-gray-400">✓ Đã có</span>
                          ) : (
                            <button onClick={() => handleAdd(q.id)}
                              className="btn-primary text-xs px-3 py-1.5">
                              <Plus size={13}/> Thêm
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

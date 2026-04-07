'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startOrGetSession, submitSession } from '../actions'
import { KaTeX } from '@/components/math/KaTeX'
import { CheckCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react'

export default function TakeAssignmentPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [isPending, start] = useTransition()

  const [assignment, setAssignment] = useState<any>(null)
  const [questions, setQuestions]   = useState<any[]>([])
  const [sessionId, setSessionId]   = useState<string>('')
  const [answers, setAnswers]       = useState<Record<string, string>>({})
  const [current, setCurrent]       = useState(0)
  const [result, setResult]         = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: a } = await supabase
        .from('assignments').select('id, title, description').eq('id', id).single()
      setAssignment(a)

      const { data: aqList } = await supabase
        .from('assignment_questions')
        .select('position, questions(id, content, option_a, option_b, option_c, option_d, correct_answer, explanation, domain, skill, difficulty)')
        .eq('assignment_id', id)
        .order('position')
      setQuestions((aqList ?? []).map(aq => aq.questions).filter(Boolean))

      const res = await startOrGetSession(id)
      if (res.error) { setError(res.error); setLoading(false); return }

      // Nếu đã hoàn thành → redirect sang trang xem lại
      if (res.finished && res.sessionId) {
        router.replace(`/student/sessions/${res.sessionId}`)
        return
      }

      setSessionId(res.sessionId ?? '')
      setLoading(false)
    }
    init()
  }, [id])

  function selectAnswer(questionId: string, letter: string) {
    setAnswers(a => ({ ...a, [questionId]: letter }))
  }

  function handleSubmit() {
    const unanswered = questions.filter(q => !answers[q.id]).length
    if (unanswered > 0) {
      if (!confirm(`Bạn còn ${unanswered} câu chưa trả lời. Nộp bài?`)) return
    }
    start(async () => {
      const res = await submitSession(sessionId, answers)
      if (res.error) { setError(res.error); return }
      setResult(res)
    })
  }

  const OPTIONS = ['A','B','C','D'] as const
  const answered = Object.keys(answers).length

  if (loading) return <div className="p-10 text-center text-gray-400">Đang tải…</div>
  if (error)   return <div className="p-10"><div className="alert-error">{error}</div></div>

  // ── Result screen ─────────────────────────────────────────────
  if (result) {
    const pct = result.score
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            pct >= 70 ? 'bg-emerald-100' : pct >= 50 ? 'bg-amber-100' : 'bg-red-100'
          }`}>
            <span className={`text-3xl font-bold ${
              pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>{pct}%</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {pct >= 70 ? '🎉 Xuất sắc!' : pct >= 50 ? '👍 Khá tốt!' : '💪 Cố gắng hơn nhé!'}
          </h2>
          <p className="text-gray-500 mb-1">
            Đúng <span className="font-bold text-gray-900">{result.correctCount}</span> / {result.total} câu hỏi
          </p>
          <p className="text-sm text-gray-400 mb-8">Bài: {assignment?.title}</p>

          {/* Per-question review */}
          <div className="text-left space-y-3 mb-8">
            {questions.map((q, i) => {
              const chosen  = answers[q.id]
              const correct = q.correct_answer
              const isRight = chosen === correct
              return (
                <div key={q.id} className={`rounded-xl p-4 border ${isRight ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${isRight ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-800 font-medium">{q.content?.slice(0, 100)}…</p>
                  </div>
                  <div className="flex gap-3 text-xs ml-7">
                    <span className={`font-semibold ${isRight ? 'text-emerald-700' : 'text-red-600'}`}>
                      Bạn chọn: {chosen ?? '—'}
                    </span>
                    {!isRight && (
                      <span className="text-emerald-700 font-semibold">Đáp án đúng: {correct}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={() => router.push('/student/dashboard')} className="btn-primary">
            Về Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Question screen ───────────────────────────────────────────
  const q = questions[current]
  if (!q) return null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Progress header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-semibold text-gray-900">{assignment?.title}</h1>
          <span className="text-sm text-gray-500">{answered}/{questions.length} đã trả lời</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill bg-blue-500"
            style={{ width: `${questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0}%` }}/>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Câu {current + 1} / {questions.length}</span>
          <span className={q.difficulty === 'Hard' ? 'text-red-500' : q.difficulty === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}>
            {q.difficulty}
          </span>
        </div>
      </div>

      {/* Question card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="bg-gray-50 rounded-xl p-5 mb-5 text-sm leading-relaxed text-gray-800">
            <KaTeX text={q.content}/>
          </div>

          <div className="space-y-2.5">
            {OPTIONS.map(letter => {
              const optKey  = `option_${letter.toLowerCase()}` as keyof typeof q
              const text    = q[optKey]
              const chosen  = answers[q.id] === letter
              return (
                <button key={letter} onClick={() => selectAnswer(q.id, letter)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    chosen
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                  }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    chosen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>{letter}</span>
                  <span className="text-sm text-gray-800"><KaTeX text={text}/></span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0}
          className="btn-secondary"><ChevronLeft size={16}/> Trước</button>

        <div className="flex gap-1.5 flex-wrap max-w-sm justify-center">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                i === current
                  ? 'bg-blue-600 text-white'
                  : answers[questions[i]?.id]
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{i + 1}</button>
          ))}
        </div>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-secondary">
            Tiếp <ChevronRight size={16}/>
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isPending}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700">
            <Send size={15}/> {isPending ? 'Đang nộp…' : 'Nộp bài'}
          </button>
        )}
      </div>
    </div>
  )
}

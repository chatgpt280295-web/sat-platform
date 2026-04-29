'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startOrGetSession, submitSession } from '@/app/student/assignments/actions'
import { KaTeX } from '@/components/math/KaTeX'
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react'

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export default function CourseQuizPage() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>()
  const router = useRouter()
  const [isPending, start] = useTransition()

  const [assignment, setAssignment] = useState<any>(null)
  const [questions, setQuestions]   = useState<any[]>([])
  const [sessionId, setSessionId]   = useState('')
  const [answers, setAnswers]       = useState<Record<string, string>>({})
  const [current, setCurrent]       = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: a } = await supabase
        .from('assignments').select('id, title, description, passing_score, course_id').eq('id', quizId).single()
      setAssignment(a)

      const { data: aqList } = await supabase
        .from('assignment_questions')
        .select('position, questions(id, content, option_a, option_b, option_c, option_d, correct_answer, domain, skill, difficulty)')
        .eq('assignment_id', quizId)
        .order('position')
      setQuestions((aqList ?? []).map(aq => aq.questions).filter(Boolean))

      const res = await startOrGetSession(quizId)
      if (res.error) { setError(res.error); setLoading(false); return }

      if (res.finished && res.sessionId) {
        router.replace(`/student/courses/${courseId}/quiz/${quizId}/result?session=${res.sessionId}`)
        return
      }

      setSessionId(res.sessionId ?? '')
      setLoading(false)
    }
    init()
  }, [quizId])

  function handleSubmit() {
    const unanswered = questions.filter(q => !answers[q.id]).length
    if (unanswered > 0 && !confirm(`Bạn còn ${unanswered} câu chưa trả lời. Nộp bài?`)) return

    start(async () => {
      const res = await submitSession(sessionId, answers)
      if (res.error) { setError(res.error); return }
      router.push(`/student/courses/${courseId}/quiz/${quizId}/result?session=${sessionId}&score=${res.score}`)
    })
  }

  if (loading) return <div className="p-10 text-center text-gray-400 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> Đang tải...</div>
  if (error)   return <div className="p-10"><div className="alert-error">{error}</div></div>

  const q        = questions[current]
  const answered = Object.keys(answers).length
  if (!q) return null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-semibold text-gray-900">{assignment?.title}</h1>
          <span className="text-sm text-gray-500">{answered}/{questions.length} đã trả lời</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill bg-blue-500"
            style={{ width: `${questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Câu {current + 1} / {questions.length}</span>
          <span className={q.difficulty === 'Hard' ? 'text-red-500' : q.difficulty === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}>
            {q.difficulty}
          </span>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="bg-gray-50 rounded-xl p-5 mb-5 text-sm leading-relaxed text-gray-800">
            <KaTeX text={q.content} />
          </div>
          <div className="space-y-2.5">
            {OPTIONS.map(letter => {
              const text   = q[`option_${letter.toLowerCase()}`]
              const chosen = answers[q.id] === letter
              return (
                <button key={letter} onClick={() => setAnswers(a => ({ ...a, [q.id]: letter }))}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    chosen ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                  }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    chosen ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>{letter}</span>
                  <span className="text-sm text-gray-800"><KaTeX text={text} /></span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0} className="btn-secondary">
          <ChevronLeft size={16} /> Trước
        </button>

        <div className="flex gap-1.5 flex-wrap max-w-xs justify-center">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                i === current ? 'bg-blue-600 text-white'
                  : answers[questions[i]?.id] ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{i + 1}</button>
          ))}
        </div>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-secondary">Tiếp <ChevronRight size={16} /></button>
        ) : (
          <button onClick={handleSubmit} disabled={isPending}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <Send size={15} /> {isPending ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        )}
      </div>
    </div>
  )
}

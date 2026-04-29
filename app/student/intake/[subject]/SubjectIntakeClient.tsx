'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react'
import { KaTeX } from '@/components/math/KaTeX'
import { submitSubjectIntake } from './actions'

const OPTIONS = ['A', 'B', 'C', 'D'] as const

interface Props {
  questions: any[]
  subject: string
  subjectLabel: string
  nextUrl?: string
}

export default function SubjectIntakeClient({ questions, subject, subjectLabel, nextUrl }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError]     = useState('')

  const q        = questions[current]
  const answered = Object.keys(answers).length

  function handleSubmit() {
    const unanswered = questions.filter(q => !answers[q.id]).length
    if (unanswered > 0 && !confirm(`Bạn còn ${unanswered} câu chưa trả lời. Nộp bài?`)) return

    start(async () => {
      try {
        const result = await submitSubjectIntake(answers, subject)
        if (nextUrl) {
          // nextUrl provided — navigate directly (combined result reads from DB)
          router.push(nextUrl)
        } else {
          // No nextUrl — show per-subject result with score params
          router.push(`/student/intake/${subject}/result?score=${result.score}&level=${result.level}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi nộp bài')
      }
    })
  }

  if (!q) return null

  const isMath = subject === 'math'

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-bold text-gray-900">Kiểm tra đầu vào</h1>
            <p className="text-sm text-gray-500">{subjectLabel}</p>
          </div>
          <span className="text-sm text-gray-500">{answered}/{questions.length} đã trả lời</span>
        </div>
        <div className="progress-track">
          <div className={`h-2 rounded-full transition-all ${isMath ? 'bg-blue-500' : 'bg-purple-500'}`}
            style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">Câu {current + 1} / {questions.length}</p>
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
                    chosen
                      ? isMath ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    chosen ? (isMath ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white') : 'bg-gray-100 text-gray-600'
                  }`}>{letter}</span>
                  <span className="text-sm text-gray-800"><KaTeX text={text} /></span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {error && <div className="alert-error text-sm mb-3">{error}</div>}

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0} className="btn-secondary">
          <ChevronLeft size={16} /> Trước
        </button>

        <div className="flex gap-1.5 flex-wrap max-w-xs justify-center">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                i === current ? (isMath ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white')
                  : answers[questions[i]?.id] ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{i + 1}</button>
          ))}
        </div>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)} className="btn-secondary">
            Tiếp <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isPending}
            className="btn-primary flex items-center gap-2">
            {isPending ? <><Loader2 size={16} className="animate-spin" /> Đang nộp...</> : <><Send size={15} /> Nộp bài</>}
          </button>
        )}
      </div>
    </div>
  )
}

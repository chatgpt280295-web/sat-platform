'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitIntakeTest } from '../actions'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

export default function IntakeTestClient({ questions }: { questions: any[] }) {
  const [current, setCurrent]   = useState(0)
  const [answers, setAnswers]   = useState<Record<string, string>>({})
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  const q        = questions[current]
  const total    = questions.length
  const answered = Object.keys(answers).length

  async function handleSubmit() {
    if (answered < total) {
      setError(`Bạn còn ${total - answered} câu chưa trả lời. Chắc chắn muốn nộp?`)
      return
    }
    setError('')
    setSubmit(true)
    const res = await submitIntakeTest(answers)
    if (res.error) { setError(res.error); setSubmit(false); return }
    router.push('/student/intake/result')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header progress */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Bài kiểm tra đầu vào</p>
          <p className="text-xs text-gray-400">Câu {current + 1} / {total}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{answered}/{total} đã trả lời</span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${(answered / total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {/* Domain badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            q.domain === 'Math' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>{q.domain}</span>
          <span className="text-xs text-gray-400">{q.skill}</span>
        </div>

        {/* Question text */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{q.content}</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {(['A','B','C','D'] as const).map(opt => {
            const text = q[`option_${opt.toLowerCase()}`]
            const selected = answers[q.id] === opt
            return (
              <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>{opt}</span>
                <span className="text-sm text-gray-800 mt-0.5">{text}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-700">{error}</p>
            <button onClick={handleSubmit} disabled={submitting}
              className="mt-2 text-sm text-amber-800 font-medium underline">
              Nộp bài ngay
            </button>
          </div>
        )}
      </div>

      {/* Number nav + submit */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Question numbers */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  i === current
                    ? 'bg-blue-600 text-white'
                    : answers[questions[i].id]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>{i + 1}</button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft size={16} /> Trước
            </button>

            {current < total - 1 ? (
              <button onClick={() => setCurrent(c => c + 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
                Tiếp <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                <Send size={15} /> {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

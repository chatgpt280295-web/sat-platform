'use client'

import { useState, useTransition } from 'react'
import { BookOpen, ExternalLink, MessageCircle, Send, CheckCircle, Loader2 } from 'lucide-react'
import { createContactRequest } from './actions'

interface Book {
  id: string
  title: string
  author: string | null
  description: string | null
  url: string | null
  image_url: string | null
}

interface Props {
  score: number
  passingScore: number
  courseId: string
  subject: string
  books: Book[]
  userName: string
  quizId: string
}

export default function PostQuizRecommendation({ score, passingScore, courseId, subject, books, userName, quizId }: Props) {
  const [message, setMessage]         = useState('')
  const [sent, setSent]               = useState(false)
  const [error, setError]             = useState('')
  const [isPending, startTransition]  = useTransition()

  const halfPassing = passingScore * 0.5
  const passed      = score >= passingScore
  const needHelp    = score < halfPassing

  function handleContact() {
    if (!message.trim()) return
    startTransition(async () => {
      try {
        await createContactRequest(courseId, quizId, message)
        setSent(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi gửi yêu cầu')
      }
    })
  }

  if (passed) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">🌟</div>
        <p className="font-semibold text-emerald-800">Tuyệt vời! Bạn đã đạt điểm đạt yêu cầu.</p>
        <p className="text-sm text-emerald-600 mt-1">Hãy tiếp tục với các bài học tiếp theo!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Book recommendations */}
      {books.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" /> Tài liệu ôn tập gợi ý
          </h3>
          <p className="text-sm text-gray-500 mb-4">Xem lại các tài liệu này để củng cố kiến thức</p>
          <div className="space-y-3">
            {books.map(book => (
              <div key={book.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                {book.image_url
                  ? <img src={book.image_url} alt={book.title} className="w-12 h-16 object-cover rounded-lg shrink-0" />
                  : <div className="w-12 h-16 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"><BookOpen size={20} className="text-blue-500" /></div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{book.title}</div>
                  {book.author && <div className="text-xs text-gray-500 mt-0.5">{book.author}</div>}
                  {book.description && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{book.description}</div>}
                  {book.url && (
                    <a href={book.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1.5">
                      Xem chi tiết <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher contact form - only when score < 50% of passing */}
      {needHelp && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <MessageCircle size={18} className="text-purple-600" /> Liên hệ giáo viên 1:1
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Điểm của bạn chưa đạt. Đặt lịch hỗ trợ 1:1 với giáo viên để được giải đáp trực tiếp.
          </p>

          {sent ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle size={16} /> Yêu cầu đã được gửi! Giáo viên sẽ liên hệ sớm.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên của bạn</label>
                <input type="text" value={userName} disabled
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nội dung cần hỗ trợ</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Mô tả câu hỏi hoặc phần bạn chưa hiểu..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              {error && <div className="alert-error text-sm">{error}</div>}
              <button onClick={handleContact} disabled={isPending || !message.trim()}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm">
                {isPending ? <><Loader2 size={16} className="animate-spin" /> Đang gửi...</> : <><Send size={16} /> Gửi yêu cầu</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

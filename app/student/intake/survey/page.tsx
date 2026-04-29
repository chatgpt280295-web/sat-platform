'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSurvey } from '../actions'
import { ClipboardList } from 'lucide-react'

export default function SurveyPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError('')
    await saveSurvey(new FormData(e.currentTarget))
    setLoading(false)
    router.push('/student/intake/math')
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
          <ClipboardList className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Khảo sát ban đầu</h1>
        <p className="text-gray-500 text-sm mt-1">
          Giúp giáo viên hiểu rõ hơn về bạn. Chỉ mất 2 phút.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-2 flex-1 bg-blue-600 rounded-full" />
          <div className="h-2 flex-1 bg-gray-200 rounded-full" />
          <span className="text-xs text-gray-400 ml-1">Bước 1/2</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Trường học</label>
              <input name="school" className="input"
                placeholder="Tên trường của bạn" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Khối lớp</label>
              <select name="grade" className="input">
                <option value="">Chọn khối...</option>
                {['Lớp 10','Lớp 11','Lớp 12','Đã tốt nghiệp','Khác'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Trình độ tiếng Anh</label>
              <select name="english_level" className="input">
                <option value="">Tự đánh giá...</option>
                {['A1','A2','B1','B2','C1','C2'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mục tiêu SAT</label>
              <select name="sat_target" className="input">
                <option value="1200">1200+</option>
                <option value="1300">1300+</option>
                <option value="1400">1400+</option>
                <option value="1500">1500+</option>
                <option value="1550">1550+</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số giờ tự học mỗi tuần</label>
            <select name="hours_per_week" className="input">
              <option value="2">Dưới 2 giờ</option>
              <option value="5">2–5 giờ</option>
              <option value="8">5–8 giờ</option>
              <option value="10">Trên 8 giờ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Điểm mạnh / môn học tốt</label>
            <textarea name="strengths" rows={2}
              className="input resize-none"
              placeholder="VD: Toán, tiếng Anh đọc hiểu..." />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl disabled:opacity-60 transition-colors text-sm">
            {loading ? 'Đang lưu...' : 'Tiếp theo → Bài kiểm tra'}
          </button>
        </form>
      </div>
    </div>
  )
}

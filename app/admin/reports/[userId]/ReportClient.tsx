'use client'
import { useState } from 'react'
import { saveProgressReport } from '../actions'
import { FileText, Printer, Save, X } from 'lucide-react'

interface Props {
  userId: string
  initialComment: string
  initialRecs: string
}

export default function ReportClient({ userId, initialComment, initialRecs }: Props) {
  const [open, setOpen]       = useState(false)
  const [comment, setComment] = useState(initialComment)
  const [recs, setRecs]       = useState(initialRecs)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  async function handleSave() {
    setSaving(true)
    await saveProgressReport(userId, comment, recs)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setOpen(false)
  }

  return (
    <>
      <div className="flex gap-2 print:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors border border-amber-200"
        >
          <FileText size={15} />
          Nhận xét GV
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Printer size={15} />
          Xuất PDF
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Nhận xét của giáo viên</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhận xét chung</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Nhận xét về tiến trình, thái độ học tập..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khuyến nghị lộ trình</label>
                <textarea
                  value={recs}
                  onChange={e => setRecs(e.target.value)}
                  placeholder="Tập trung kỹ năng nào, bài cần ôn thêm..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? 'Đang lưu...' : saved ? '✓ Đã lưu' : 'Lưu nhận xét'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

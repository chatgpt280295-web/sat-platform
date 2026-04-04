'use client'

import { useState, useTransition } from 'react'
import { importQuestionsFromCSV } from './actions'
import { X, Upload } from 'lucide-react'
import Papa from 'papaparse'

export default function QuestionImportModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows]     = useState<any[]>([])
  const [error, setError]   = useState('')
  const [result, setResult] = useState<any>(null)
  const [isPending, start]  = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length) { setError(errors[0].message); return }
        setError('')
        setRows(data as any[])
      }
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal w-full max-w-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Nhập câu hỏi từ CSV</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        {!result ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
              <p className="font-medium mb-1">Cột bắt buộc:</p>
              <code className="text-xs">domain, skill, difficulty, content, option_a, option_b, option_c, option_d, correct_answer</code>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4">
              <Upload size={28} className="text-gray-300 mx-auto mb-3"/>
              <label className="btn-secondary cursor-pointer inline-flex">
                <input type="file" accept=".csv" className="hidden" onChange={handleFile}/>
                Chọn file CSV
              </label>
            </div>
            {error && <div className="alert-error mb-4">{error}</div>}
            {rows.length > 0 && (
              <>
                <p className="text-sm font-medium text-gray-600 mb-3">{rows.length} câu hỏi sẽ được nhập</p>
                <div className="flex gap-3">
                  <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
                  <button onClick={() => start(async () => setResult(await importQuestionsFromCSV(rows)))}
                    disabled={isPending} className="btn-primary flex-1 justify-center">
                    {isPending ? 'Đang nhập…' : `Nhập ${rows.length} câu hỏi`}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            {result.success
              ? <><div className="text-4xl mb-3">✅</div><p className="font-semibold text-gray-900">Nhập thành công {result.count} câu hỏi!</p></>
              : <><div className="text-4xl mb-3">❌</div><p className="text-red-600">{result.error}</p></>}
            <button onClick={onClose} className="btn-primary mt-5">Đóng</button>
          </div>
        )}
      </div>
    </div>
  )
}

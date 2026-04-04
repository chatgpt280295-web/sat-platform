'use client'

import { useState, useTransition } from 'react'
import { importStudentsFromCSV } from './actions'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

export default function ImportCSVModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows]       = useState<any[]>([])
  const [parseError, setPErr] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isPending, start]    = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data, errors }) => {
        if (errors.length) { setPErr(errors[0].message); return }
        setPErr('')
        setRows((data as any[]).filter(r => r.email && r.full_name))
      }
    })
  }

  function handleImport() {
    start(async () => {
      const res = await importStudentsFromCSV(rows)
      setResults(res)
    })
  }

  const done   = results.filter(r => r.success).length
  const failed = results.filter(r => r.error).length

  return (
    <div className="modal-backdrop">
      <div className="modal w-full max-w-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Nhập học viên từ CSV</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {results.length === 0 ? (
          <>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4">
              <Upload size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1 font-medium">Chọn file CSV</p>
              <p className="text-xs text-gray-400 mb-4">Cột bắt buộc: email, full_name. Tuỳ chọn: expires_at</p>
              <label className="btn-secondary cursor-pointer inline-flex">
                <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
                Chọn file
              </label>
            </div>
            {parseError && <div className="alert-error mb-4">{parseError}</div>}
            {rows.length > 0 && (
              <>
                <p className="text-sm font-medium text-gray-600 mb-3">{rows.length} học viên sẽ được nhập</p>
                <div className="max-h-40 overflow-y-auto table-wrap mb-4">
                  <table className="table text-xs">
                    <thead><tr><th>Họ tên</th><th>Email</th><th>Hết hạn</th></tr></thead>
                    <tbody>
                      {rows.slice(0, 8).map((r, i) => (
                        <tr key={i}><td>{r.full_name}</td><td>{r.email}</td><td>{r.expires_at || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
                  <button onClick={handleImport} disabled={isPending} className="btn-primary flex-1 justify-center">
                    {isPending ? 'Đang nhập…' : `Nhập ${rows.length} học viên`}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-3 mb-4">
              {done   > 0 && <span className="badge badge-green"><CheckCircle size={13}/> {done} thành công</span>}
              {failed > 0 && <span className="badge badge-red"><AlertCircle size={13}/> {failed} thất bại</span>}
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${r.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {r.success ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                  <span className="font-medium">{r.full_name}</span>
                  <span className="text-xs opacity-60">{r.email}</span>
                  {r.error && <span className="ml-auto text-xs">{r.error}</span>}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="btn-primary w-full justify-center mt-4">Đóng</button>
          </div>
        )}
      </div>
    </div>
  )
}

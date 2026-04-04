'use client'

import { useState, useTransition } from 'react'
import { createStudent } from './actions'
import { X, Copy, Check } from 'lucide-react'

interface CreatedInfo { name: string; email: string; password: string }

export default function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [form, setForm]       = useState({ email: '', full_name: '', expires_at: '' })
  const [error, setError]     = useState('')
  const [created, setCreated] = useState<CreatedInfo | null>(null)
  const [copied, setCopied]   = useState(false)
  const [isPending, start]    = useTransition()

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) fd.set(k, v) })
    start(async () => {
      const res = await createStudent(fd)
      if (res.error) { setError(res.error); return }
      setCreated({ name: form.full_name, email: form.email, password: res.tempPassword ?? '' })
    })
  }

  function copyAll() {
    if (!created) return
    navigator.clipboard.writeText(`Email: ${created.email}\nMật khẩu: ${created.password}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">
            {created ? 'Tạo tài khoản thành công' : 'Thêm học viên mới'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>

        {created ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-emerald-800">
                ✅ Đã tạo tài khoản cho <span className="font-bold">{created.name}</span>
              </p>
              <div className="bg-white rounded-lg border border-emerald-100 divide-y divide-emerald-100">
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Email</p>
                  <p className="text-sm font-mono text-gray-900">{created.email}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">Mật khẩu tạm</p>
                  <p className="text-lg font-mono font-bold text-gray-900 tracking-widest">{created.password}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              ⚠️ Lưu thông tin ngay — mật khẩu sẽ không hiển thị lại sau khi đóng.
            </p>
            <div className="flex gap-3">
              <button onClick={copyAll} className="btn-secondary flex-1">
                {copied ? <><Check size={14}/> Đã copy!</> : <><Copy size={14}/> Copy thông tin</>}
              </button>
              <button onClick={onClose} className="btn-primary flex-1 justify-center">Đóng</button>
            </div>
          </div>
        ) : (
          <>
            {error && <div className="alert-error mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Họ và tên *</label>
                <input className="input" placeholder="Nguyễn Văn A"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} required/>
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" placeholder="student@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required/>
              </div>
              <div>
                <label className="label">Ngày hết hạn</label>
                <input className="input" type="date"
                  value={form.expires_at} onChange={e => set('expires_at', e.target.value)}/>
                <p className="text-xs text-gray-400 mt-1">Để trống nếu không giới hạn</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
                <button type="submit" disabled={isPending} className="btn-primary flex-1 justify-center">
                  {isPending ? 'Đang tạo…' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-400 mt-4">Mật khẩu tạm sẽ hiển thị ngay trên màn hình sau khi tạo.</p>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Eye, EyeOff, RefreshCw, Copy, Check, X } from 'lucide-react'
import { resetStudentPassword } from './actions'

interface Props {
  userId: string
  studentName: string
  onClose: () => void
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function ResetPasswordModal({ userId, studentName, onClose }: Props) {
  const [password, setPassword]   = useState(generatePassword)
  const [show, setShow]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)
  const [done, setDone]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await resetStudentPassword(userId, password)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setDone(true)
  }

  function handleCopy() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Đặt lại mật khẩu</h2>
            <p className="text-sm text-gray-500 mt-0.5">{studentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {done ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 font-medium text-sm mb-3">
                  ✅ Đặt lại mật khẩu thành công!
                </p>
                <p className="text-xs text-green-700 mb-2">Mật khẩu mới của <strong>{studentName}</strong>:</p>
                <div className="flex items-center gap-2 bg-white border border-green-300 rounded-lg px-3 py-2">
                  <code className="flex-1 font-mono text-green-900 text-sm tracking-widest">{password}</code>
                  <button onClick={handleCopy}
                    className="text-green-600 hover:text-green-800 transition-colors shrink-0">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  ⚠️ Hãy gửi mật khẩu này cho học sinh — sẽ không hiển thị lại.
                </p>
              </div>
              <button onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors text-sm">
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600">
                Nhập mật khẩu mới hoặc dùng mật khẩu được tạo tự động bên dưới.
              </p>

              {/* Password input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Tối thiểu 6 ký tự"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShow(!show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button type="button" onClick={() => setPassword(generatePassword())}
                    title="Tạo ngẫu nhiên"
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                    <RefreshCw size={15} />
                    <span>Ngẫu nhiên</span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Hủy
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl disabled:opacity-60 transition-colors text-sm">
                  {loading ? 'Đang lưu...' : 'Xác nhận đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

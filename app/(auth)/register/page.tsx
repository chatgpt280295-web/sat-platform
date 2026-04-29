'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerStudent } from './actions'

// ── Inner form (needs useSearchParams inside Suspense) ────────────────────────
function RegisterForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') || '/'

  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const pwStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'ok' : 'weak'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPw) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    setLoading(true)
    try {
      await registerStudent({ fullName, email, password })

      // Tự đăng nhập sau khi đăng ký thành công
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })

      setSuccess(true)
      setTimeout(() => {
        router.push(redirectTo)
        router.refresh()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-gray-500 text-sm">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Miễn phí · Bắt đầu ngay hôm nay</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Họ và tên</label>
              <input
                type="text"
                className="input"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      pwStrength === 'strong' ? 'w-full bg-green-500' :
                      pwStrength === 'ok'     ? 'w-2/3 bg-amber-400' :
                                               'w-1/3 bg-red-400'
                    }`} />
                  </div>
                  <span className={`text-xs ${
                    pwStrength === 'strong' ? 'text-green-600' :
                    pwStrength === 'ok'     ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {pwStrength === 'strong' ? 'Mạnh' : pwStrength === 'ok' ? 'Trung bình' : 'Yếu'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="label">Xác nhận mật khẩu</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder="Nhập lại mật khẩu"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Đang tạo tài khoản...</> : 'Đăng ký'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link
            href={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            Đăng nhập
          </Link>
        </p>

        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <RegisterForm />
    </Suspense>
  )
}

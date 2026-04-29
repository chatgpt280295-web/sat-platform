'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

// ── Inner component (needs useSearchParams inside Suspense) ───────────────────
function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') || '/'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
      setLoading(false)
      return
    }

    // Redirect về trang trước đó hoặc về / để middleware xử lý
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">SAT Platform</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục học</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <button type="button" className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                Quên mật khẩu?
              </button>
            </div>

            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Đang đăng nhập...</> : 'Đăng nhập'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link
            href={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            Đăng ký ngay
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
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <LoginForm />
    </Suspense>
  )
}

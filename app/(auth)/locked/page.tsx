import { Lock } from 'lucide-react'
import Link from 'next/link'

export default function LockedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Tài khoản tạm khóa</h1>
        <p className="text-gray-600 mb-2">
          Tài khoản của bạn hiện đang bị tạm ngưng truy cập.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Vui lòng liên hệ giáo viên để gia hạn hoặc kích hoạt lại tài khoản.
        </p>
        <Link href="/login" className="btn-secondary inline-flex">
          ← Quay lại trang đăng nhập
        </Link>
      </div>
    </div>
  )
}

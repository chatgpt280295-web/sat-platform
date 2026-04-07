import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CheckInPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createClient()

  // Phải đăng nhập
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/checkin/${params.sessionId}`)

  const { data: profile } = await supabase
    .from('users').select('id, full_name, role').eq('auth_id', user.id).single()
  if (!profile || profile.role !== 'student') {
    return <ErrorPage message="Chỉ học sinh mới có thể điểm danh." />
  }

  const { data: session } = await supabase
    .from('class_sessions')
    .select('*, classes(name)')
    .eq('id', params.sessionId).single()

  if (!session) return <ErrorPage message="Buổi học không tồn tại." />

  const now = new Date()
  const opensAt  = new Date(session.opens_at)
  const closesAt = new Date(session.closes_at)

  // Kiểm tra học sinh có trong lớp không
  const { data: member } = await supabase
    .from('class_members')
    .select('id')
    .eq('class_id', session.class_id)
    .eq('user_id', profile.id)
    .single()

  if (!member) {
    return <ErrorPage message="Bạn không thuộc lớp học này." />
  }

  // Đã điểm danh chưa?
  const { data: existing } = await supabase
    .from('attendances')
    .select('status, checked_in_at')
    .eq('session_id', params.sessionId)
    .eq('user_id', profile.id)
    .single()

  if (existing && existing.status !== 'absent') {
    return (
      <SuccessPage
        name={profile.full_name}
        sessionTitle={session.title}
        className={(session.classes as any)?.name}
        status={existing.status}
        time={existing.checked_in_at}
      />
    )
  }

  // Kiểm tra window điểm danh
  if (now < opensAt) {
    return <ErrorPage message={`Điểm danh chưa mở. Mở lúc ${opensAt.toLocaleTimeString('vi-VN')}`} />
  }

  if (now > closesAt) {
    // Đánh dấu là đi muộn
    await supabase.from('attendances').upsert({
      session_id: params.sessionId, user_id: profile.id,
      status: 'late', checked_in_at: now.toISOString()
    }, { onConflict: 'session_id,user_id' })

    return (
      <SuccessPage
        name={profile.full_name}
        sessionTitle={session.title}
        className={(session.classes as any)?.name}
        status="late"
        time={now.toISOString()}
      />
    )
  }

  // Điểm danh hợp lệ
  await supabase.from('attendances').upsert({
    session_id: params.sessionId, user_id: profile.id,
    status: 'present', checked_in_at: now.toISOString()
  }, { onConflict: 'session_id,user_id' })

  return (
    <SuccessPage
      name={profile.full_name}
      sessionTitle={session.title}
      className={(session.classes as any)?.name}
      status="present"
      time={now.toISOString()}
    />
  )
}

function SuccessPage({ name, sessionTitle, className, status, time }: any) {
  const isLate = status === 'late'
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isLate ? 'bg-yellow-100' : 'bg-green-100'
        }`}>
          {isLate
            ? <Clock className="w-10 h-10 text-yellow-500" />
            : <CheckCircle className="w-10 h-10 text-green-500" />
          }
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {isLate ? 'Điểm danh muộn' : 'Điểm danh thành công!'}
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {isLate ? 'Bạn đã check-in sau giờ quy định.' : 'Bạn đã được ghi nhận có mặt.'}
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
          <Row label="Học sinh" value={name} />
          <Row label="Buổi học"  value={sessionTitle} />
          <Row label="Lớp"      value={className} />
          <Row label="Thời gian" value={new Date(time).toLocaleString('vi-VN')} />
          <Row label="Trạng thái" value={isLate ? '🟡 Đi muộn' : '🟢 Có mặt'} />
        </div>
        <a href="/student/dashboard"
          className="block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors text-sm">
          Về trang chủ
        </a>
      </div>
    </div>
  )
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể điểm danh</h2>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <a href="/student/dashboard"
          className="block bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm">
          Về trang chủ
        </a>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

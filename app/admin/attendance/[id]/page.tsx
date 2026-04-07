import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, CheckCircle, Clock, XCircle } from 'lucide-react'
import AttendanceActions from './AttendanceActions'
import CopyLinkButton from './CopyLinkButton'

export const dynamic = 'force-dynamic'

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('class_sessions')
    .select('*, classes(name)')
    .eq('id', params.id).single()
  if (!session) notFound()

  const { data: attendances } = await supabase
    .from('attendances')
    .select('*, users(full_name, email)')
    .eq('session_id', params.id)
    .order('status')

  const now      = new Date()
  const isOpen   = now >= new Date(session.opens_at) && now <= new Date(session.closes_at)
  const present  = attendances?.filter(a => a.status === 'present').length ?? 0
  const late     = attendances?.filter(a => a.status === 'late').length ?? 0
  const absent   = attendances?.filter(a => a.status === 'absent').length ?? 0
  const total    = attendances?.length ?? 0
  const checkInUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/checkin/${params.id}`

  return (
    <div className="p-8">
      <Link href="/admin/attendance" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 w-fit">
        <ChevronLeft size={16} /> Danh sách buổi học
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {(session.classes as any)?.name} ·{' '}
            {new Date(session.session_date).toLocaleDateString('vi-VN')} ·{' '}
            {new Date(session.opens_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            {' — '}
            {new Date(session.closes_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {isOpen && (
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse">
            Đang mở điểm danh
          </span>
        )}
      </div>

      {/* Check-in link */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Link điểm danh</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-white border border-blue-200 rounded-lg px-3 py-2 text-blue-900 overflow-x-auto">
            {checkInUrl}
          </code>
          <CopyLinkButton url={checkInUrl} />
        </div>
        <p className="text-xs text-blue-600 mt-2">Chia sẻ link này cho học sinh điểm danh trực tiếp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Có mặt', value: present, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Đi muộn', value: late,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Vắng',   value: absent,  color: 'text-red-500',   bg: 'bg-red-50'   },
          { label: 'Tổng',   value: total,   color: 'text-gray-900',  bg: 'bg-gray-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Danh sách điểm danh</h3>
        </div>
        {(!attendances || attendances.length === 0) ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chưa có học viên nào trong lớp này</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {attendances.map((a: any) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {a.status === 'present' && <CheckCircle size={16} className="text-green-500 shrink-0" />}
                  {a.status === 'late'    && <Clock size={16}        className="text-yellow-500 shrink-0" />}
                  {a.status === 'absent'  && <XCircle size={16}      className="text-red-400 shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.users?.full_name}</p>
                    <p className="text-xs text-gray-400">{a.users?.email}</p>
                  </div>
                </div>
                <AttendanceActions
                  sessionId={params.id}
                  userId={a.user_id}
                  currentStatus={a.status}
                  checkedInAt={a.checked_in_at}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


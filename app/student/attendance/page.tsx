import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarCheck, CheckCircle, Clock, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_MAP = {
  present: { label: 'Có mặt', icon: CheckCircle, cls: 'text-green-600', bg: 'bg-green-50' },
  late:    { label: 'Muộn',   icon: Clock,        cls: 'text-yellow-600', bg: 'bg-yellow-50' },
  absent:  { label: 'Vắng',   icon: XCircle,      cls: 'text-red-500',   bg: 'bg-red-50' },
}

export default async function StudentAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: records } = await supabase
    .from('attendances')
    .select('status, checked_in_at, class_sessions(title, session_date, opens_at, classes(name))')
    .eq('user_id', profile.id)
    .order('checked_in_at', { ascending: false })

  const total   = records?.length ?? 0
  const present = records?.filter(r => r.status === 'present').length ?? 0
  const late    = records?.filter(r => r.status === 'late').length ?? 0
  const absent  = records?.filter(r => r.status === 'absent').length ?? 0
  const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : null

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Điểm danh của tôi</h1>
        <p className="text-gray-500 text-sm mt-1">Lịch sử tham dự buổi học</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng buổi', value: total, bg: 'bg-gray-50', text: 'text-gray-900' },
          { label: 'Có mặt',   value: present, bg: 'bg-green-50', text: 'text-green-700' },
          { label: 'Muộn',     value: late,    bg: 'bg-yellow-50', text: 'text-yellow-700' },
          { label: 'Vắng',     value: absent,  bg: 'bg-red-50',   text: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance rate bar */}
      {rate !== null && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">Tỷ lệ có mặt (bao gồm muộn)</span>
            <span className={`font-bold ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {rate}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
      )}

      {/* Records list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <CalendarCheck size={17} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900 text-sm">Lịch sử điểm danh</h2>
        </div>
        {total === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <CalendarCheck size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-400">Chưa có buổi học nào</p>
            <p className="text-sm text-gray-300 mt-1">Giáo viên sẽ tạo buổi học và chia sẻ link điểm danh</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(records ?? []).map((r: any, idx: number) => {
              const sess  = r.class_sessions as any
              const info  = STATUS_MAP[r.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.absent
              const Icon  = info.icon
              return (
                <div key={idx} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${info.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={17} className={info.cls} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sess?.title ?? '—'}</p>
                      <p className="text-xs text-gray-400">
                        {sess?.classes?.name && <span className="mr-2">{sess.classes.name}</span>}
                        {sess?.session_date
                          ? new Date(sess.session_date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${info.bg} ${info.cls}`}>
                      {info.label}
                    </span>
                    {r.checked_in_at && r.status !== 'absent' && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.checked_in_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

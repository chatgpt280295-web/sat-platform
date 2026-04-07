import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarCheck, Users, Clock, Plus } from 'lucide-react'
import CreateSessionModal from './CreateSessionModal'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes').select('id, name').order('name')

  const { data: sessions } = await supabase
    .from('class_sessions')
    .select(`
      id, title, session_date, opens_at, closes_at,
      classes(name),
      attendances(count)
    `)
    .order('session_date', { ascending: false })
    .order('opens_at',    { ascending: false })
    .limit(50)

  const now = new Date()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Điểm danh</h1>
          <p className="text-sm text-gray-500 mt-1">{sessions?.length ?? 0} buổi học</p>
        </div>
        <CreateSessionModal classes={classes ?? []} />
      </div>

      {(!sessions || sessions.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Chưa có buổi học nào</p>
          <p className="text-gray-400 text-sm mt-1">Tạo buổi học để bắt đầu điểm danh</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s: any) => {
            const isOpen   = now >= new Date(s.opens_at) && now <= new Date(s.closes_at)
            const isPast   = now > new Date(s.closes_at)
            const count    = s.attendances?.[0]?.count ?? 0

            return (
              <Link key={s.id} href={`/admin/attendance/${s.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-gray-300 hover:shadow-sm transition-all block">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isOpen ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <CalendarCheck className={`w-5 h-5 ${isOpen ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {(s.classes as any)?.name}
                      </span>
                      {isOpen && (
                        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full animate-pulse">
                          Đang mở
                        </span>
                      )}
                      {isPast && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Đã kết thúc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarCheck size={11} />
                        {new Date(s.session_date).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(s.opens_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {new Date(s.closes_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users size={11} />
                        {count} học viên
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-blue-600 font-medium shrink-0">Xem →</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

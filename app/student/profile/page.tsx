import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Target, BookOpen, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

const TIER_INFO: Record<number, { label: string; desc: string; cls: string }> = {
  1: { label: 'Tier 1 — Cơ bản',    desc: 'Tổng SAT < 900',     cls: 'bg-red-100    text-red-700    border-red-200'    },
  2: { label: 'Tier 2 — Trung bình', desc: '900 – 1099',         cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  3: { label: 'Tier 3 — Khá',        desc: '1100 – 1299',        cls: 'bg-blue-100   text-blue-700   border-blue-200'   },
  4: { label: 'Tier 4 — Giỏi',       desc: '≥ 1300',             cls: 'bg-green-100  text-green-700  border-green-200'  },
}

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name, email, tier, created_at').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Survey
  const { data: survey } = await supabase
    .from('intake_surveys').select('*').eq('user_id', profile.id).maybeSingle()

  // Diagnostic
  const { data: diagnostic } = await supabase
    .from('diagnostic_results')
    .select('math_score, rw_score, total_score, tier, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle()

  // Quick stats
  const { count: sessionCount } = await supabase
    .from('sessions').select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id).not('finished_at', 'is', null)

  const { count: attCount } = await supabase
    .from('attendances').select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  const tier = profile.tier ?? diagnostic?.tier
  const initials = profile.full_name
    .split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hồ sơ học viên</h1>

      {/* Avatar + basic info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-5 flex items-center gap-5">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{profile.full_name}</h2>
          <p className="text-blue-200 text-sm mt-0.5">{profile.email}</p>
          <p className="text-blue-300 text-xs mt-1">
            Tham gia từ {new Date(profile.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {tier && (
          <div className="text-right shrink-0">
            <p className="text-blue-200 text-xs mb-1">Năng lực</p>
            <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-bold border ${TIER_INFO[tier]?.cls ?? 'bg-white/20 text-white border-white/30'}`}>
              {TIER_INFO[tier]?.label ?? `Tier ${tier}`}
            </span>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { icon: BookOpen,   label: 'Bài đã làm',  value: sessionCount ?? 0,  color: 'blue'   },
          { icon: User,       label: 'Buổi tham dự', value: attCount ?? 0,      color: 'teal'   },
          { icon: TrendingUp, label: 'Điểm Math',    value: diagnostic?.math_score  ? `${Math.round(Number(diagnostic.math_score))}` : '—', color: 'purple' },
          { icon: Target,     label: 'Mục tiêu',     value: survey?.sat_target  ? `${survey.sat_target}` : '—', color: 'amber'  },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <div className={`w-8 h-8 bg-${color}-50 rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Intake test scores — read only */}
      {diagnostic ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <TrendingUp size={15} className="text-blue-600" /> Kết quả kiểm tra đầu vào
            </h2>
            <Link href="/student/intake/result" className="text-xs text-blue-600 hover:underline">
              Xem chi tiết →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-semibold mb-1">Math</p>
              <p className="text-2xl font-bold text-blue-700">{Math.round(Number(diagnostic.math_score)) ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 800</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-purple-600 font-semibold mb-1">Reading &amp; Writing</p>
              <p className="text-2xl font-bold text-purple-700">{Math.round(Number(diagnostic.rw_score)) ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 800</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-600 font-semibold mb-1">Tổng SAT</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(Number(diagnostic.total_score)) ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 1600</p>
            </div>
          </div>
          {tier && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">Xếp loại năng lực</span>
              <span className={`px-3 py-1 rounded-lg font-semibold text-xs border ${TIER_INFO[tier]?.cls}`}>
                {TIER_INFO[tier]?.label} &nbsp;·&nbsp; {TIER_INFO[tier]?.desc}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-800 text-sm">Chưa có kết quả kiểm tra đầu vào</p>
            <p className="text-xs text-amber-600 mt-0.5">Làm bài kiểm tra để xác định tier và nhận lộ trình phù hợp</p>
          </div>
          <Link href="/student/intake"
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors">
            Làm ngay →
          </Link>
        </div>
      )}

      {/* Editable profile form */}
      <ProfileClient
        fullName={profile.full_name}
        survey={survey ?? null}
      />
    </div>
  )
}

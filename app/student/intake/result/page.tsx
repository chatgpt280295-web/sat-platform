import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Target, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TIER_INFO: Record<number, { name: string; range: string; desc: string; color: string; bg: string }> = {
  1: { name: 'Foundation',  range: '< 900',       desc: 'Nền tảng đang được xây dựng. Tập trung vào kiến thức cơ bản.',      color: 'text-gray-700',   bg: 'bg-gray-100'   },
  2: { name: 'Developing',  range: '900 – 1100',  desc: 'Đã có nền tảng. Cần củng cố và luyện tập kỹ năng thường xuyên.',    color: 'text-blue-700',   bg: 'bg-blue-100'   },
  3: { name: 'Proficient',  range: '1100 – 1300', desc: 'Khá vững vàng. Tập trung vào chiến lược làm bài và tối ưu điểm.',   color: 'text-purple-700', bg: 'bg-purple-100' },
  4: { name: 'Advanced',    range: '> 1300',      desc: 'Gần mục tiêu! Tối ưu hóa từng điểm và luyện tập mock test đầy đủ.', color: 'text-green-700',  bg: 'bg-green-100'  },
}

export default async function IntakeResultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: result } = await supabase
    .from('diagnostic_results')
    .select('math_score, rw_score, tier, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle()

  // No result + no tier → redirect back
  if (!result && !profile.tier) redirect('/student/intake')

  const tier     = profile.tier ?? result?.tier ?? 1
  const tierInfo = TIER_INFO[tier] ?? TIER_INFO[1]
  const total    = result ? ((result.math_score ?? 0) + (result.rw_score ?? 0)) : 0

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kết quả đánh giá đầu vào</h1>
        <p className="text-gray-500 text-sm mt-1">Chào {profile.full_name} — đây là điểm xuất phát của bạn</p>
      </div>

      <div className={`rounded-2xl p-6 mb-6 ${tierInfo.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tier của bạn</p>
            <h2 className={`text-3xl font-bold mt-1 ${tierInfo.color}`}>
              Tier {tier} — {tierInfo.name}
            </h2>
          </div>
          <div className={`w-16 h-16 rounded-2xl ${tierInfo.bg} border-2 border-white shadow flex items-center justify-center`}>
            <span className="text-3xl font-black text-gray-700">{tier}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600">{tierInfo.desc}</p>
        <p className="text-xs text-gray-400 mt-2">SAT Equivalent: {tierInfo.range}</p>
      </div>

      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Điểm chi tiết</h3>
          <div className="space-y-3">
            <ScoreRow label="Math" score={result.math_score ?? 0} max={800} color="bg-blue-500" />
            <ScoreRow label="Reading & Writing" score={result.rw_score ?? 0} max={800} color="bg-purple-500" />
            <div className="pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-medium text-gray-700">Tổng điểm (SAT Scale)</span>
              <span className="text-lg font-bold text-gray-900">{total}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Bước tiếp theo</h3>
        <div className="space-y-2">
          {[
            { icon: BookOpen, text: 'Giáo viên sẽ giao bài tập phù hợp với Tier của bạn' },
            { icon: Target,   text: 'Làm đủ bài tập để cải thiện điểm số từng tuần' },
            { icon: TrendingUp, text: 'Theo dõi tiến trình trên Dashboard cá nhân' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={14} className="text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <Link href="/student/dashboard"
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-center transition-colors text-sm">
        Về Dashboard →
      </Link>
    </div>
  )
}

function ScoreRow({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{score} / {max}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

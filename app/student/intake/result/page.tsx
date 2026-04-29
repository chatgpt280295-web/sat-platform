// ── Imports ────────────────────────────────────────────────────────────────────
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, Target, BookOpen, Calculator, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────────
const TIER_INFO: Record<number, { name: string; range: string; desc: string; color: string; bg: string }> = {
  1: { name: 'Foundation',  range: '< 900',       desc: 'Nền tảng đang được xây dựng. Tập trung vào kiến thức cơ bản.',      color: 'text-gray-700',   bg: 'bg-gray-100'   },
  2: { name: 'Developing',  range: '900 – 1100',  desc: 'Đã có nền tảng. Cần củng cố và luyện tập kỹ năng thường xuyên.',    color: 'text-blue-700',   bg: 'bg-blue-100'   },
  3: { name: 'Proficient',  range: '1100 – 1300', desc: 'Khá vững vàng. Tập trung vào chiến lược làm bài và tối ưu điểm.',   color: 'text-purple-700', bg: 'bg-purple-100' },
  4: { name: 'Advanced',    range: '> 1300',      desc: 'Gần mục tiêu! Tối ưu hóa từng điểm và luyện tập mock test đầy đủ.', color: 'text-green-700',  bg: 'bg-green-100'  },
}

const LEVEL_LABELS: Record<number, string> = { 1: 'Cơ Bản', 2: 'Trung Cấp', 3: 'Nâng Cao' }

function scoreToLevel(score: number | null): 1 | 2 | 3 {
  if (!score || score <= 450) return 1
  if (score <= 650) return 2
  return 3
}

function formatPrice(price: number | null) {
  if (!price || price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function IntakeResultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const admin = createAdminClient()

  const [{ data: diagnostics }, { data: courses }] = await Promise.all([
    admin
      .from('diagnostic_results')
      .select('math_score, rw_score, tier, subject, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    admin
      .from('courses')
      .select('id, name, subject, level, price')
      .eq('is_published', true)
      .order('level'),
  ])

  const mathDiag = (diagnostics ?? []).find((d: any) => d.subject === 'math') ?? null
  const engDiag  = (diagnostics ?? []).find((d: any) => d.subject === 'english') ?? null
  const anyDiag  = mathDiag ?? engDiag ?? (diagnostics ?? [])[0] ?? null

  if (!anyDiag && !profile.tier) redirect('/student/intake')

  const tier     = profile.tier ?? anyDiag?.tier ?? 1
  const tierInfo = TIER_INFO[tier] ?? TIER_INFO[1]

  // Fall back to anyDiag for single-row DB designs where subject isn't split
  const mathScore = mathDiag?.math_score ?? anyDiag?.math_score ?? null
  const rwScore   = engDiag?.rw_score ?? anyDiag?.rw_score ?? null
  const total     = (mathScore ?? 0) + (rwScore ?? 0)

  // ── Recommendation logic ───────────────────────────────────────────────────
  const mathLevel = scoreToLevel(mathScore)
  const rwLevel   = scoreToLevel(rwScore)
  const allCourses = (courses ?? []) as Array<{ id: string; name: string; subject: string | null; level: number | null; price: number | null }>

  let recMath = allCourses.filter(c => c.subject === 'math' && c.level === mathLevel)
  if (recMath.length === 0) recMath = allCourses.filter(c => c.subject === 'math')

  let recEng = allCourses.filter(c => c.subject === 'english' && c.level === rwLevel)
  if (recEng.length === 0) recEng = allCourses.filter(c => c.subject === 'english')

  const hasRecs = recMath.length > 0 || recEng.length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Kết quả đánh giá đầu vào</h1>
        <p className="text-gray-500 text-sm mt-1">Chào {profile.full_name} — đây là điểm xuất phát của bạn</p>
      </div>

      {/* Tier card */}
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

      {/* Scores */}
      {(mathScore !== null || rwScore !== null) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Điểm chi tiết</h3>
          <div className="space-y-3">
            {mathScore !== null && <ScoreRow label="Math" score={mathScore} max={800} color="bg-blue-500" />}
            {rwScore   !== null && <ScoreRow label="Reading & Writing" score={rwScore} max={800} color="bg-purple-500" />}
            {mathScore !== null && rwScore !== null && (
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <span className="text-sm font-medium text-gray-700">Tổng điểm (SAT Scale)</span>
                <span className="text-lg font-bold text-gray-900">{total}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course recommendations */}
      {hasRecs && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Khóa học phù hợp cho bạn</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Math */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calculator size={14} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Toán SAT</span>
              </div>
              {recMath.length > 0 ? (
                <div className="space-y-2">
                  {recMath.slice(0, 2).map(c => (
                    <Link key={c.id} href={`/courses/${c.id}`}
                      className="block bg-white border border-blue-100 hover:border-blue-300 rounded-xl p-3 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug mb-1 group-hover:text-blue-700 transition-colors">{c.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                              Level {c.level} — {LEVEL_LABELS[c.level ?? 1]}
                            </span>
                            <span className="text-xs text-gray-500">{formatPrice(c.price)}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-3 italic">Chưa có khóa học Toán. Vui lòng quay lại sau.</p>
              )}
            </div>

            {/* English */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen size={14} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Tiếng Anh SAT</span>
              </div>
              {recEng.length > 0 ? (
                <div className="space-y-2">
                  {recEng.slice(0, 2).map(c => (
                    <Link key={c.id} href={`/courses/${c.id}`}
                      className="block bg-white border border-purple-100 hover:border-purple-300 rounded-xl p-3 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug mb-1 group-hover:text-purple-700 transition-colors">{c.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
                              Level {c.level} — {LEVEL_LABELS[c.level ?? 1]}
                            </span>
                            <span className="text-xs text-gray-500">{formatPrice(c.price)}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-3 italic">Chưa có khóa học Tiếng Anh. Vui lòng quay lại sau.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Bước tiếp theo</h3>
        <div className="space-y-2">
          {[
            { icon: BookOpen,   text: 'Giáo viên sẽ giao bài tập phù hợp với Tier của bạn' },
            { icon: Target,     text: 'Làm đủ bài tập để cải thiện điểm số từng tuần' },
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

// ── Sub-components ─────────────────────────────────────────────────────────────
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

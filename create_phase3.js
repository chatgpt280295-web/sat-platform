// create_phase3.js — Phase 3: M05 Error Analysis + M06 Dashboard & Reports
// Run from sat-platform\: node create_phase3.js

const fs = require('fs')
const path = require('path')

const BASE = __dirname
let fileCount = 0

function write(relPath, content) {
  const full = path.join(BASE, relPath)
  const dir = path.dirname(full)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const tmp = full + '._w'
  fs.writeFileSync(tmp, content, 'utf8')
  try { fs.unlinkSync(full) } catch (_) {}
  fs.renameSync(tmp, full)
  fileCount++
  console.log('✓', relPath, `(${content.length} bytes)`)
}

// ─── 1. Admin Reports Actions ──────────────────────────────────────────────
write('app/admin/reports/actions.ts', `'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getAllStudentsWithStats() {
  const admin = createAdminClient()
  const { data: students } = await admin
    .from('users')
    .select('id, full_name, email, tier, status, created_at')
    .eq('role', 'student')
    .order('full_name')

  if (!students) return []

  const results = await Promise.all(students.map(async (s) => {
    const [{ data: sessions }, { data: att }, { count: errCnt }] = await Promise.all([
      admin.from('sessions')
        .select('score, finished_at')
        .eq('user_id', s.id)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(10),
      admin.from('attendances').select('status').eq('user_id', s.id),
      admin.from('error_logs').select('*', { count: 'exact', head: true }).eq('user_id', s.id),
    ])

    const totalAtt = att?.length ?? 0
    const presentCnt = att?.filter(a => ['present', 'late'].includes(a.status ?? '')).length ?? 0
    const avgScore = sessions && sessions.length > 0
      ? Math.round(sessions.reduce((sum, x) => sum + (x.score ?? 0), 0) / sessions.length)
      : null

    return {
      ...s,
      latestScore: sessions?.[0]?.score ?? null,
      avgScore,
      attendanceRate: totalAtt > 0 ? Math.round(presentCnt / totalAtt * 100) : null,
      errorCount: errCnt ?? 0,
      sessionCount: sessions?.length ?? 0,
    }
  }))

  return results
}

export async function getStudentReportData(userId: string) {
  const admin = createAdminClient()
  const [
    { data: student },
    { data: sessions },
    { data: diagnostic },
    { data: attendances },
    { data: errors },
    { data: survey },
    { data: report },
  ] = await Promise.all([
    admin.from('users').select('id, full_name, email, tier, status').eq('id', userId).single(),
    admin.from('sessions')
      .select('id, score, finished_at, correct_count, total_questions, assignments(title)')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: true }),
    admin.from('diagnostic_results')
      .select('math_score, rw_score, total_score, tier, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('attendances').select('status, checked_in_at').eq('user_id', userId),
    admin.from('error_logs')
      .select('domain, skill, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    admin.from('intake_surveys')
      .select('sat_target, english_level, school, grade')
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('progress_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!student) return null

  const totalAtt = attendances?.length ?? 0
  const presentCnt = attendances?.filter(a => ['present', 'late'].includes(a.status ?? '')).length ?? 0
  const absentCnt = attendances?.filter(a => a.status === 'absent').length ?? 0

  // Group errors by skill
  const skillMap: Record<string, { count: number; domain: string }> = {}
  errors?.forEach(e => {
    const key = e.skill || e.domain || 'Khác'
    if (!skillMap[key]) skillMap[key] = { count: 0, domain: e.domain ?? '' }
    skillMap[key].count++
  })

  const topErrors = Object.entries(skillMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([skill, d]) => ({ skill, count: d.count, domain: d.domain }))

  return {
    student,
    sessions: sessions ?? [],
    diagnostic,
    totalAtt,
    presentCnt,
    absentCnt,
    attendanceRate: totalAtt > 0 ? Math.round(presentCnt / totalAtt * 100) : null,
    topErrors,
    mathErrors: errors?.filter(e => e.domain === 'Math').length ?? 0,
    rwErrors: errors?.filter(e => e.domain === 'Reading & Writing').length ?? 0,
    totalErrors: errors?.length ?? 0,
    survey,
    report,
  }
}

export async function saveProgressReport(
  userId: string,
  teacherComment: string,
  recommendations: string,
) {
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('progress_reports')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    await admin.from('progress_reports')
      .update({ teacher_comment: teacherComment, recommendations })
      .eq('id', existing.id)
  } else {
    await admin.from('progress_reports').insert({
      user_id: userId,
      teacher_comment: teacherComment,
      recommendations,
    })
  }

  revalidatePath(\`/admin/reports/\${userId}\`)
  return { success: true }
}
`)

// ─── 2. Admin Reports List Page ────────────────────────────────────────────
write('app/admin/reports/page.tsx', `import { getAllStudentsWithStats } from './actions'
import Link from 'next/link'
import { BarChart2, TrendingUp, Users, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function TierBadge({ tier }: { tier: number | null }) {
  if (!tier) return <span className="text-gray-400 text-xs">Chưa xếp</span>
  const colors: Record<number, string> = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-blue-100 text-blue-700',
    4: 'bg-green-100 text-green-700',
  }
  return (
    <span className={\`inline-flex px-2 py-0.5 rounded text-xs font-semibold \${colors[tier] ?? 'bg-gray-100 text-gray-600'}\`}>
      Tier {tier}
    </span>
  )
}

function MiniBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-400 text-sm">—</span>
  const color = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-100 rounded-full h-2">
        <div className={\`\${color} h-2 rounded-full\`} style={{ width: \`\${Math.min(value, 100)}%\` }} />
      </div>
      <span className="text-sm font-medium text-gray-700">{value}%</span>
    </div>
  )
}

export default async function ReportsPage() {
  const students = await getAllStudentsWithStats()

  const withScores = students.filter(s => s.avgScore !== null)
  const classAvg = withScores.length > 0
    ? Math.round(withScores.reduce((sum, s) => sum + (s.avgScore ?? 0), 0) / withScores.length)
    : null

  const needsAttention = students.filter(s =>
    (s.attendanceRate !== null && s.attendanceRate < 70) || s.errorCount > 10
  ).length

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
        <p className="text-gray-500 mt-1">Theo dõi tiến trình và phân tích lỗi từng học viên</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-sm">Tổng học viên</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{students.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">Điểm TB toàn lớp</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {classAvg !== null ? classAvg + '%' : '—'}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-gray-500 text-sm">Cần chú ý</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{needsAttention}</div>
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart2 size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-900">Danh sách học viên</h2>
        </div>
        {students.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Chưa có học viên nào.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Học viên</th>
                <th className="px-6 py-3 text-left">Tier</th>
                <th className="px-6 py-3 text-left">Điểm TB</th>
                <th className="px-6 py-3 text-left">Điểm danh</th>
                <th className="px-6 py-3 text-center">Lỗi sai</th>
                <th className="px-6 py-3 text-center">Bài đã làm</th>
                <th className="px-6 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(s => {
                const flagged =
                  (s.attendanceRate !== null && s.attendanceRate < 70) || s.errorCount > 10
                return (
                  <tr
                    key={s.id}
                    className={\`hover:bg-gray-50 transition-colors \${flagged ? 'bg-orange-50/40' : ''}\`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {flagged && <AlertCircle size={14} className="text-orange-400 shrink-0" />}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{s.full_name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><TierBadge tier={s.tier} /></td>
                    <td className="px-6 py-4"><MiniBar value={s.avgScore} /></td>
                    <td className="px-6 py-4">
                      {s.attendanceRate !== null ? (
                        <span className={\`text-sm font-semibold \${
                          s.attendanceRate >= 80 ? 'text-green-600'
                          : s.attendanceRate >= 60 ? 'text-yellow-600'
                          : 'text-red-600'
                        }\`}>
                          {s.attendanceRate}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={\`text-sm font-semibold \${s.errorCount > 10 ? 'text-red-600' : 'text-gray-700'}\`}>
                        {s.errorCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-700">{s.sessionCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={\`/admin/reports/\${s.id}\`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Xem →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
`)

// ─── 3. Individual Student Report Page ────────────────────────────────────
write('app/admin/reports/[userId]/page.tsx', `import { getStudentReportData } from '../actions'
import { notFound } from 'next/navigation'
import ReportClient from './ReportClient'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function ScoreBar({ value, max = 100, color = 'bg-blue-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className={\`\${color} h-3 rounded-full transition-all\`} style={{ width: \`\${pct}%\` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-10 text-right">{value}%</span>
    </div>
  )
}

function TierBadge({ tier }: { tier: number | null }) {
  if (!tier) return <span className="text-gray-400">Chưa xếp tier</span>
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: 'Tier 1 — Cơ bản',    cls: 'bg-red-100 text-red-700 border-red-200' },
    2: { label: 'Tier 2 — Trung bình', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    3: { label: 'Tier 3 — Khá',        cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    4: { label: 'Tier 4 — Giỏi',       cls: 'bg-green-100 text-green-700 border-green-200' },
  }
  const { label, cls } = map[tier] ?? { label: 'Tier ' + tier, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={\`inline-flex px-3 py-1 rounded-lg text-sm font-semibold border \${cls}\`}>
      {label}
    </span>
  )
}

export default async function StudentReportPage({ params }: { params: { userId: string } }) {
  const data = await getStudentReportData(params.userId)
  if (!data) notFound()

  const {
    student, sessions, diagnostic, survey,
    totalAtt, presentCnt, absentCnt, attendanceRate,
    topErrors, mathErrors, rwErrors, totalErrors,
    report,
  } = data

  const latestScore = sessions.length > 0 ? sessions[sessions.length - 1].score : null
  const firstScore  = sessions.length > 0 ? sessions[0].score : null
  const improvement = latestScore !== null && firstScore !== null ? latestScore - firstScore : null

  const maxError = topErrors.length > 0 ? topErrors[0].count : 1

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 print:hidden">
        <Link href="/admin/reports" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{student.full_name}</h1>
          <p className="text-gray-400 text-sm">{student.email}</p>
        </div>
        <TierBadge tier={student.tier} />
        <ReportClient
          userId={params.userId}
          initialComment={report?.teacher_comment ?? ''}
          initialRecs={report?.recommendations ?? ''}
        />
      </div>

      {/* Print Header (only visible on print) */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">Báo cáo học tập — {student.full_name}</h1>
            <p className="text-gray-500 text-sm">{student.email} · Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <TierBadge tier={student.tier} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Score Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">
            📈 Điểm số
          </h2>
          {diagnostic ? (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Điểm đầu vào (Intake)</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Math</p>
                  <p className="font-bold text-gray-900">{diagnostic.math_score ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">R&W</p>
                  <p className="font-bold text-gray-900">{diagnostic.rw_score ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tổng</p>
                  <p className="font-bold text-blue-700">{diagnostic.total_score ?? '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">Chưa làm Intake Test</p>
          )}

          {sessions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Điểm bài tập ({sessions.length} bài)</span>
                {improvement !== null && (
                  <span className={improvement >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {improvement >= 0 ? '+' : ''}{improvement}% so với bài đầu
                  </span>
                )}
              </div>
              {sessions.slice(-6).map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={\`h-2 rounded-full \${(s.score ?? 0) >= 70 ? 'bg-green-500' : (s.score ?? 0) >= 50 ? 'bg-yellow-400' : 'bg-red-400'}\`}
                      style={{ width: \`\${s.score ?? 0}%\` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{s.score ?? 0}%</span>
                </div>
              ))}
              {latestScore !== null && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-500">Điểm bài mới nhất</span>
                  <span className={\`font-bold \${latestScore >= 70 ? 'text-green-600' : latestScore >= 50 ? 'text-yellow-600' : 'text-red-600'}\`}>
                    {latestScore}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chưa làm bài tập nào</p>
          )}

          {survey?.sat_target && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Mục tiêu SAT</span>
              <span className="font-semibold text-gray-800">{survey.sat_target}</span>
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">
            📅 Điểm danh
          </h2>
          {totalAtt === 0 ? (
            <p className="text-sm text-gray-400">Chưa có buổi học nào</p>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tỷ lệ có mặt</span>
                  <span className={\`font-bold \${(attendanceRate ?? 0) >= 80 ? 'text-green-600' : (attendanceRate ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}\`}>
                    {attendanceRate ?? 0}%
                  </span>
                </div>
                <ScoreBar
                  value={attendanceRate ?? 0}
                  color={(attendanceRate ?? 0) >= 80 ? 'bg-green-500' : (attendanceRate ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-green-700">{presentCnt}</p>
                  <p className="text-xs text-green-600">Có mặt</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-yellow-700">{totalAtt - presentCnt - absentCnt}</p>
                  <p className="text-xs text-yellow-600">Muộn</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-red-700">{absentCnt}</p>
                  <p className="text-xs text-red-600">Vắng</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">Tổng {totalAtt} buổi học</p>
            </>
          )}
        </div>
      </div>

      {/* Error Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-500">
          🔍 Phân tích lỗi sai (M05)
        </h2>
        {totalErrors === 0 ? (
          <p className="text-sm text-gray-400">Chưa có dữ liệu lỗi. Học viên cần làm bài trắc nghiệm.</p>
        ) : (
          <>
            {/* Domain split */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Math</p>
                <p className="text-2xl font-bold text-blue-700">{mathErrors}</p>
                <p className="text-xs text-blue-500">lỗi toán học</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-purple-800 mb-1">Reading & Writing</p>
                <p className="text-2xl font-bold text-purple-700">{rwErrors}</p>
                <p className="text-xs text-purple-500">lỗi đọc hiểu</p>
              </div>
            </div>

            {/* Top errors by skill */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top lỗi theo kỹ năng</h3>
            <div className="space-y-3">
              {topErrors.map((err, i) => (
                <div key={err.skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      {err.count > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">
                          ⚠ {err.count}x
                        </span>
                      )}
                      <span className="text-gray-700 font-medium">{err.skill}</span>
                      <span className="text-xs text-gray-400">({err.domain})</span>
                    </div>
                    <span className="text-gray-500">{err.count} lỗi</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className={\`h-2 rounded-full \${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}\`}
                      style={{ width: \`\${Math.round((err.count / maxError) * 100)}%\` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Tổng {totalErrors} lỗi từ {sessions.length} bài làm. Lỗi xuất hiện &gt; 3 lần được highlight đỏ.
            </p>
          </>
        )}
      </div>

      {/* Teacher Comment — print-visible */}
      {(report?.teacher_comment || report?.recommendations) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wide text-amber-700">
            ✏️ Nhận xét & Khuyến nghị của giáo viên
          </h2>
          {report.teacher_comment && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-1 uppercase">Nhận xét</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{report.teacher_comment}</p>
            </div>
          )}
          {report.recommendations && (
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1 uppercase">Khuyến nghị lộ trình</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{report.recommendations}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
`)

// ─── 4. ReportClient (client component: save comment + print button) ────────
write('app/admin/reports/[userId]/ReportClient.tsx', `'use client'
import { useState } from 'react'
import { saveProgressReport } from '../actions'
import { FileText, Printer, Save, X } from 'lucide-react'

interface Props {
  userId: string
  initialComment: string
  initialRecs: string
}

export default function ReportClient({ userId, initialComment, initialRecs }: Props) {
  const [open, setOpen]       = useState(false)
  const [comment, setComment] = useState(initialComment)
  const [recs, setRecs]       = useState(initialRecs)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  async function handleSave() {
    setSaving(true)
    await saveProgressReport(userId, comment, recs)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setOpen(false)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors border border-amber-200"
        >
          <FileText size={15} />
          Nhận xét giáo viên
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Printer size={15} />
          Xuất PDF
        </button>
      </div>

      {/* Modal: Teacher comment */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Nhận xét của giáo viên</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nhận xét chung
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Nhận xét về tiến trình, thái độ học tập của học sinh..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Khuyến nghị lộ trình
                </label>
                <textarea
                  value={recs}
                  onChange={e => setRecs(e.target.value)}
                  placeholder="Tập trung vào kỹ năng nào, bài nào cần ôn thêm..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? 'Đang lưu...' : saved ? '✓ Đã lưu' : 'Lưu nhận xét'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
`)

// ─── 5. Update AdminSidebar — add Báo cáo nav item ─────────────────────────
write('components/shared/AdminSidebar.tsx', `'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, LayoutDashboard, Users, HelpCircle,
  ClipboardList, GraduationCap, CalendarCheck, BarChart2, LogOut,
} from 'lucide-react'

const NAV = [
  { href: '/admin/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/classes',     label: 'Lớp học',     icon: GraduationCap   },
  { href: '/admin/attendance',  label: 'Điểm danh',   icon: CalendarCheck   },
  { href: '/admin/users',       label: 'Học viên',    icon: Users           },
  { href: '/admin/questions',   label: 'Câu hỏi',     icon: HelpCircle      },
  { href: '/admin/assignments', label: 'Bài tập',     icon: ClipboardList   },
  { href: '/admin/reports',     label: 'Báo cáo',     icon: BarChart2       },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none">SAT Platform</div>
            <div className="text-xs text-gray-400 mt-0.5">Quản trị viên</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={\`nav-item \${active ? 'nav-item-active' : 'nav-item-default'}\`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={logout} className="nav-item nav-item-default w-full">
          <LogOut size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
`)

// ─── 6. Update Student Dashboard — enhanced with error stats + intake ───────
write('app/student/dashboard/page.tsx', `import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList, TrendingUp, GraduationCap, CheckCircle, Clock, AlertTriangle, CalendarCheck } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function ScoreBar({ value, color = 'bg-blue-500' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={\`\${color} h-2 rounded-full\`} style={{ width: \`\${Math.min(value, 100)}%\` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{value}%</span>
    </div>
  )
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name, email, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Classes
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id, classes(id, name, description)')
    .eq('user_id', profile.id)
  const myClasses = memberships?.map(m => m.classes as any) ?? []
  const classIds  = memberships?.map(m => m.class_id) ?? []

  // Assignments
  let totalAssignments = 0, pendingAssignments = 0
  const assignmentIds: string[] = []
  if (classIds.length > 0) {
    const { data: ca } = await supabase
      .from('class_assignments').select('assignment_id').in('class_id', classIds)
    const ids = Array.from(new Set((ca ?? []).map(r => r.assignment_id)))
    assignmentIds.push(...ids)
    totalAssignments = ids.length
    if (ids.length > 0) {
      const { count } = await supabase
        .from('sessions').select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id).not('finished_at', 'is', null).in('assignment_id', ids)
      pendingAssignments = ids.length - (count ?? 0)
    }
  }

  // Sessions (all)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, score, finished_at, assignments(title)')
    .eq('user_id', profile.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(6)

  const avgScore = sessions && sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length)
    : null

  // Attendance
  const { data: attendances } = await supabase
    .from('attendances').select('status').eq('user_id', profile.id)
  const totalAtt   = attendances?.length ?? 0
  const presentCnt = attendances?.filter(a => ['present', 'late'].includes(a.status ?? '')).length ?? 0
  const attRate    = totalAtt > 0 ? Math.round(presentCnt / totalAtt * 100) : null

  // Diagnostic (intake)
  const { data: diagnostic } = await supabase
    .from('diagnostic_results')
    .select('math_score, rw_score, total_score, tier')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Top errors
  const { data: errors } = await supabase
    .from('error_logs')
    .select('skill, domain')
    .eq('user_id', profile.id)
  const skillMap: Record<string, number> = {}
  errors?.forEach(e => {
    const k = e.skill || e.domain || 'Khác'
    skillMap[k] = (skillMap[k] ?? 0) + 1
  })
  const topErrors = Object.entries(skillMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill, count]) => ({ skill, count }))

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  const tierLabel: Record<number, string> = {
    1: 'Cơ bản', 2: 'Trung bình', 3: 'Khá', 4: 'Giỏi',
  }
  const tierColor: Record<number, string> = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-blue-100 text-blue-700',
    4: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-blue-200 text-sm mb-1">{greet},</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{profile.full_name} 👋</h1>
            <p className="text-blue-100 text-sm">{profile.email}</p>
          </div>
          {(profile.tier || diagnostic?.tier) && (
            <div className="text-right">
              <p className="text-blue-200 text-xs mb-1">Năng lực</p>
              <span className={\`inline-flex px-3 py-1 rounded-lg text-sm font-bold bg-white/20 text-white\`}>
                Tier {profile.tier ?? diagnostic?.tier} — {tierLabel[profile.tier ?? diagnostic?.tier ?? 1] ?? ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Intake CTA if no tier */}
      {!profile.tier && !diagnostic && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800 text-sm">Bạn chưa làm bài kiểm tra đầu vào</p>
            <p className="text-amber-600 text-xs mt-0.5">Hoàn thành để xác định tier và nhận lộ trình học phù hợp</p>
          </div>
          <Link href="/student/intake"
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            Làm ngay →
          </Link>
        </div>
      )}

      {/* Intake scores (if done) */}
      {diagnostic && (
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            Điểm đầu vào (Intake Test)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Math</p>
              <p className="text-2xl font-bold text-blue-700">{diagnostic.math_score ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 800</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Reading & Writing</p>
              <p className="text-2xl font-bold text-purple-700">{diagnostic.rw_score ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 800</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Tổng SAT</p>
              <p className="text-3xl font-bold text-gray-900">{diagnostic.total_score ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 1600</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500">Bài tập</p>
          <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500">Chưa làm</p>
          <p className="text-2xl font-bold text-gray-900">{pendingAssignments}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs text-gray-500">Điểm TB</p>
          <p className="text-2xl font-bold text-gray-900">{avgScore !== null ? avgScore + '%' : '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center mb-2">
            <CalendarCheck className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xs text-gray-500">Điểm danh</p>
          <p className="text-2xl font-bold text-gray-900">{attRate !== null ? attRate + '%' : '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Recent results with score bars */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Kết quả gần đây</h2>
            <Link href="/student/results" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Xem tất cả →
            </Link>
          </div>
          {(!sessions || sessions.length === 0) ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Chưa có kết quả nào. Hãy bắt đầu làm bài!
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              {sessions.slice(0, 5).map((s: any) => (
                <div key={s.id}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate max-w-[160px] font-medium">{s.assignments?.title ?? '—'}</span>
                    <span className="text-gray-400">{new Date(s.finished_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <ScoreBar
                    value={Math.round(s.score ?? 0)}
                    color={(s.score ?? 0) >= 70 ? 'bg-green-500' : (s.score ?? 0) >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error analysis */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Top lỗi cần cải thiện</h2>
          </div>
          {topErrors.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Làm bài tập để xem phân tích lỗi của bạn
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {topErrors.map((err, i) => (
                <div key={err.skill}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={\`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold \${
                        i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'
                      }\`}>{i + 1}</span>
                      <span className="font-medium text-gray-700">{err.skill}</span>
                    </div>
                    <span className="text-gray-400">{err.count} lỗi</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className={\`h-2 rounded-full \${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}\`}
                      style={{ width: topErrors[0]?.count ? \`\${Math.round((err.count / topErrors[0].count) * 100)}%\` : '0%' }}
                    />
                  </div>
                </div>
              ))}
              {errors && errors.length > 0 && (
                <p className="text-xs text-gray-400 pt-1">Tổng {errors.length} lỗi được ghi nhận</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Classes */}
      {myClasses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-600" />
            Lớp học của tôi
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {myClasses.map((cls: any) => (
              <div key={cls.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{cls.name}</p>
                  {cls.description && <p className="text-xs text-gray-400 mt-0.5">{cls.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA: pending assignments */}
      {pendingAssignments > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-blue-700 font-medium">
            Bạn còn <strong>{pendingAssignments}</strong> bài tập chưa làm
          </p>
          <Link href="/student/assignments"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            Làm ngay →
          </Link>
        </div>
      )}
    </div>
  )
}
`)

// ─── 7. Update Student Assignments Actions — add error logging ──────────────
write('app/student/assignments/actions.ts', `'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startOrGetSession(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Chưa đăng nhập' }

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return { error: 'Không tìm thấy user' }

  // Check existing unfinished session
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', profile.id)
    .eq('assignment_id', assignmentId)
    .is('finished_at', null)
    .single()

  if (existing) return { success: true, sessionId: existing.id }

  // Count questions
  const { count } = await supabase
    .from('assignment_questions').select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)

  const admin = createAdminClient()
  const { data: session, error } = await admin.from('sessions').insert({
    user_id:         profile.id,
    assignment_id:   assignmentId,
    total_questions: count ?? 0,
  }).select('id').single()

  if (error) return { error: error.message }
  return { success: true, sessionId: session.id }
}

export async function submitSession(
  sessionId: string,
  answers: Record<string, string>  // questionId -> chosen answer
) {
  const admin = createAdminClient()

  // Get session info (assignment_id + user_id for error logging)
  const { data: session } = await admin
    .from('sessions')
    .select('assignment_id, user_id')
    .eq('id', sessionId)
    .single()
  if (!session) return { error: 'Session không tồn tại' }

  // Get questions with correct answers + domain/skill for error analysis
  const { data: aqList } = await admin
    .from('assignment_questions')
    .select('question_id, questions(correct_answer, domain, skill)')
    .eq('assignment_id', session.assignment_id)

  if (!aqList) return { error: 'Không tìm thấy câu hỏi' }

  // Calculate score
  let correctCount = 0
  const answerRows = aqList.map(aq => {
    const chosen    = answers[aq.question_id] ?? null
    const correctAns = (aq.questions as any)?.correct_answer
    const isCorrect = chosen !== null && chosen === correctAns
    if (isCorrect) correctCount++
    return {
      session_id:    sessionId,
      question_id:   aq.question_id,
      chosen_answer: chosen,
      is_correct:    isCorrect,
    }
  })

  await admin.from('answers').insert(answerRows)

  const score = aqList.length > 0 ? Math.round((correctCount / aqList.length) * 100) : 0

  const { error } = await admin.from('sessions').update({
    finished_at:     new Date().toISOString(),
    correct_count:   correctCount,
    total_questions: aqList.length,
    score,
  }).eq('id', sessionId)

  if (error) return { error: error.message }

  // Auto-log errors for wrong answers (M05 Error Analysis)
  const errorRows = answerRows
    .filter(row => !row.is_correct && row.chosen_answer !== null)
    .map(row => {
      const aq = aqList.find(q => q.question_id === row.question_id)
      const q  = aq?.questions as any
      return {
        user_id:       session.user_id,
        question_id:   row.question_id,
        session_id:    sessionId,
        assignment_id: session.assignment_id,
        domain:        q?.domain ?? null,
        skill:         q?.skill ?? null,
        chosen_answer: row.chosen_answer,
      }
    })

  if (errorRows.length > 0) {
    await admin.from('error_logs').insert(errorRows)
  }

  revalidatePath('/student/results')
  revalidatePath('/student/dashboard')
  return { success: true, score, correctCount, total: aqList.length }
}
`)

// ─── Done ──────────────────────────────────────────────────────────────────
console.log(\`
✅ Phase 3 done! \${fileCount} files created/updated:
  app/admin/reports/actions.ts
  app/admin/reports/page.tsx
  app/admin/reports/[userId]/page.tsx
  app/admin/reports/[userId]/ReportClient.tsx
  components/shared/AdminSidebar.tsx  (+ Báo cáo nav)
  app/student/dashboard/page.tsx      (enhanced)
  app/student/assignments/actions.ts  (+ error logging)
\`)

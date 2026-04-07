import { getStudentReportData } from '../actions'
import { notFound } from 'next/navigation'
import ReportClient from './ReportClient'
import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold border ${cls}`}>
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
    topErrors, mathErrors, rwErrors, totalErrors, report,
  } = data

  const latestScore = sessions.length > 0 ? (sessions[sessions.length - 1] as any).score : null
  const firstScore  = sessions.length > 0 ? (sessions[0] as any).score : null
  const improvement = latestScore !== null && firstScore !== null ? latestScore - firstScore : null
  const maxErr      = topErrors.length > 0 ? topErrors[0].count : 1

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
          initialComment={(report as any)?.teacher_comment ?? ''}
          initialRecs={(report as any)?.recommendations ?? ''}
        />
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">Báo cáo học tập — {student.full_name}</h1>
            <p className="text-gray-500 text-sm">
              {student.email} · Ngày xuất: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
          <TierBadge tier={student.tier} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Score Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">📈 Điểm số</h2>
          {diagnostic ? (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-blue-600 font-semibold">Điểm đầu vào (Intake Test)</p>
                <Link
                  href={`/admin/intake/results/${params.userId}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Eye size={12} /> Xem bài làm
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500">Math</p>
                  <p className="font-bold text-gray-900 text-lg">{(diagnostic as any).math_score ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">R&amp;W</p>
                  <p className="font-bold text-gray-900 text-lg">{(diagnostic as any).rw_score ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tổng</p>
                  <p className="font-bold text-blue-700 text-lg">{(diagnostic as any).total_score ?? '—'}</p>
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
                  <span className={improvement >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {improvement >= 0 ? '+' : ''}{improvement}%
                  </span>
                )}
              </div>
              {(sessions as any[]).slice(-6).map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${(s.score ?? 0) >= 70 ? 'bg-green-500' : (s.score ?? 0) >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${s.score ?? 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{s.score ?? 0}%</span>
                  <Link href={`/admin/sessions/${s.id}`} className="text-blue-500 hover:text-blue-700">
                    <Eye size={13} />
                  </Link>
                </div>
              ))}
              {latestScore !== null && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-500">Bài mới nhất</span>
                  <span className={`font-bold ${latestScore >= 70 ? 'text-green-600' : latestScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {latestScore}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Chưa làm bài tập nào</p>
          )}

          {(survey as any)?.sat_target && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Mục tiêu SAT</span>
              <span className="font-semibold text-gray-800">{(survey as any).sat_target}</span>
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">📅 Điểm danh</h2>
          {totalAtt === 0 ? (
            <p className="text-sm text-gray-400">Chưa có buổi học nào</p>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tỷ lệ có mặt</span>
                  <span className={`font-bold ${(attendanceRate ?? 0) >= 80 ? 'text-green-600' : (attendanceRate ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {attendanceRate ?? 0}%
                  </span>
                </div>
                <div className="bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${(attendanceRate ?? 0) >= 80 ? 'bg-green-500' : (attendanceRate ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${attendanceRate ?? 0}%` }}
                  />
                </div>
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
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">🔍 Phân tích lỗi sai (M05)</h2>
        {totalErrors === 0 ? (
          <p className="text-sm text-gray-400">Chưa có dữ liệu lỗi. Học viên cần làm bài trắc nghiệm.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-blue-700 mb-1">Math</p>
                <p className="text-2xl font-bold text-blue-700">{mathErrors}</p>
                <p className="text-xs text-blue-500">lỗi toán học</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-purple-700 mb-1">Reading &amp; Writing</p>
                <p className="text-2xl font-bold text-purple-700">{rwErrors}</p>
                <p className="text-xs text-purple-500">lỗi đọc hiểu</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-semibold text-gray-700 mb-1">Tổng lỗi</p>
                <p className="text-2xl font-bold text-gray-800">{totalErrors}</p>
                <p className="text-xs text-gray-500">từ {sessions.length} bài</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3">Top lỗi theo kỹ năng</h3>
            <div className="space-y-3">
              {topErrors.map((err: any, i: number) => (
                <div key={err.skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      {err.count > 3 && (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600 font-semibold">
                          ⚠ {err.count}x
                        </span>
                      )}
                      <span className="text-gray-700 font-medium">{err.skill}</span>
                      <span className="text-xs text-gray-400">({err.domain})</span>
                    </div>
                    <span className="text-gray-500 text-xs">{err.count} lỗi</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}`}
                      style={{ width: `${Math.round((err.count / maxErr) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Lỗi xuất hiện hơn 3 lần được đánh dấu cảnh báo đỏ.
            </p>
          </>
        )}
      </div>

      {/* Teacher Comment */}
      {((report as any)?.teacher_comment || (report as any)?.recommendations) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-4">
            ✏️ Nhận xét & Khuyến nghị của giáo viên
          </h2>
          {(report as any).teacher_comment && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Nhận xét</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{(report as any).teacher_comment}</p>
            </div>
          )}
          {(report as any).recommendations && (
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">Khuyến nghị lộ trình</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{(report as any).recommendations}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { getAllStudentsWithStats } from './actions'
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
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${colors[tier] ?? 'bg-gray-100 text-gray-600'}`}>
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
        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700">{value}%</span>
    </div>
  )
}

export default async function ReportsPage() {
  const students = await getAllStudentsWithStats()

  const withScores = students.filter((s: any) => s.avgScore !== null)
  const classAvg = withScores.length > 0
    ? Math.round(withScores.reduce((sum: number, s: any) => sum + (s.avgScore ?? 0), 0) / withScores.length)
    : null

  const needsAttention = students.filter((s: any) =>
    (s.attendanceRate !== null && s.attendanceRate < 70) || s.errorCount > 10
  ).length

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Phân tích</h1>
        <p className="text-gray-500 mt-1">Theo dõi tiến trình và phân tích lỗi từng học viên</p>
      </div>

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
              {students.map((s: any) => {
                const flagged = (s.attendanceRate !== null && s.attendanceRate < 70) || s.errorCount > 10
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${flagged ? 'bg-orange-50/40' : ''}`}>
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
                        <span className={`text-sm font-semibold ${
                          s.attendanceRate >= 80 ? 'text-green-600'
                          : s.attendanceRate >= 60 ? 'text-yellow-600'
                          : 'text-red-600'
                        }`}>{s.attendanceRate}%</span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-semibold ${s.errorCount > 10 ? 'text-red-600' : 'text-gray-700'}`}>
                        {s.errorCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-700">{s.sessionCount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/reports/${s.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium">
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

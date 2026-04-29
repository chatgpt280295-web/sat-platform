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

  const needsAttention = students.filter((s: any) => s.errorCount > 10).length

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><BarChart2 size={20} /> Báo cáo & Phân tích</h1>
          <p className="page-subtitle">Theo dõi tiến trình và phân tích lỗi từng học viên</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon bg-blue-50">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng học viên</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{students.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-50">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Điểm TB toàn lớp</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{classAvg !== null ? classAvg + '%' : '—'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-orange-50">
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Cần chú ý (&gt;10 lỗi)</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{needsAttention}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <BarChart2 size={16} className="text-gray-400" /> Danh sách học viên
          </h2>
        </div>
        {students.length === 0 ? (
          <div className="empty-state py-16">
            <p className="text-gray-400">Chưa có học viên nào.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Tier</th>
                  <th>Điểm TB</th>
                  <th className="text-center">Khóa học</th>
                  <th className="text-center">Bài đã học</th>
                  <th className="text-center">Lỗi sai</th>
                  <th className="text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s: any) => {
                  const flagged = s.errorCount > 10
                  return (
                    <tr key={s.id} className={flagged ? 'bg-orange-50/30' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          {flagged && <AlertCircle size={13} className="text-orange-400 shrink-0" />}
                          <div>
                            <p className="font-medium text-gray-900">{s.full_name}</p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><TierBadge tier={s.tier} /></td>
                      <td><MiniBar value={s.avgScore} /></td>
                      <td className="text-center text-gray-700">{s.enrolledCourses ?? 0}</td>
                      <td className="text-center text-gray-700">{s.completedLessons ?? 0}</td>
                      <td className="text-center">
                        <span className={`font-semibold ${s.errorCount > 10 ? 'text-red-600' : 'text-gray-700'}`}>
                          {s.errorCount}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link href={`/admin/reports/${s.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium">
                          Xem →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

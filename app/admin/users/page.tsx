import { createClient } from '@/lib/supabase/server'
import CreateUserButton from './CreateUserButton'
import UserActionsClient from './UserActionsClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('users')
    .select('id, email, full_name, status, tier, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý học viên</h1>
          <p className="page-subtitle">{students?.length ?? 0} học viên</p>
        </div>
        <CreateUserButton />
      </div>

      <div className="card">
        {(!students || students.length === 0) ? (
          <div className="empty-state py-20">
            <span className="text-4xl mb-4">👥</span>
            <p className="text-gray-500 font-medium">Chưa có học viên nào</p>
          </div>
        ) : (
          <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Tier</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-700 font-semibold text-sm">
                          {s.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.full_name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <UserActionsClient userId={s.id} studentName={s.full_name} status={s.status} tier={s.tier} mode="tier" />
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {s.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="text-gray-500">{new Date(s.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="text-right">
                    <UserActionsClient userId={s.id} studentName={s.full_name} status={s.status} tier={s.tier} mode="actions" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}

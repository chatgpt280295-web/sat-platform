import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, ClipboardList, Trash2 } from 'lucide-react'
import DeleteAssignmentBtn from './DeleteAssignmentBtn'

export default async function AdminAssignmentsPage() {
  const supabase = await createClient()
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, created_at, assignment_questions(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý bài tập</h1>
          <p className="page-subtitle">{assignments?.length ?? 0} bài tập</p>
        </div>
        <Link href="/admin/assignments/new" className="btn-primary">
          <Plus size={15}/> Tạo bài tập
        </Link>
      </div>

      {!assignments?.length ? (
        <div className="card">
          <div className="empty-state py-20">
            <ClipboardList size={48} className="text-gray-200 mb-4"/>
            <p className="text-gray-400 font-medium">Chưa có bài tập nào</p>
            <p className="text-gray-400 text-sm mt-1">Tạo bài tập đầu tiên để giao cho học viên</p>
            <Link href="/admin/assignments/new" className="btn-primary mt-5">
              <Plus size={15}/> Tạo bài tập
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const qCount = (a.assignment_questions as any)?.[0]?.count ?? 0
            const overdue = a.due_date && new Date(a.due_date) < new Date()
            return (
              <div key={a.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{a.title}</h3>
                      <span className="badge badge-blue shrink-0">{qCount} câu hỏi</span>
                      {a.due_date && (
                        <span className={`badge shrink-0 ${overdue ? 'badge-red' : 'badge-yellow'}`}>
                          {overdue ? 'Quá hạn' : 'Hạn'}: {formatDate(a.due_date)}
                        </span>
                      )}
                    </div>
                    {a.description && (
                      <p className="text-sm text-gray-500 truncate">{a.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Tạo: {formatDate(a.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/assignments/${a.id}`} className="btn-secondary text-sm">
                      Quản lý
                    </Link>
                    <Link href={`/admin/assignments/${a.id}/results`} className="btn-secondary text-sm text-green-700 border-green-200 bg-green-50 hover:bg-green-100">
                      Kết quả
                    </Link>
                    <DeleteAssignmentBtn id={a.id} title={a.title}/>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

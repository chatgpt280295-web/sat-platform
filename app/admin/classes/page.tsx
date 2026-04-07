import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import CreateClassModal from './CreateClassModal'

export const dynamic = 'force-dynamic'

export default async function ClassesPage() {
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id, name, description, created_at,
      class_members(count),
      class_assignments(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lớp học</h1>
          <p className="text-sm text-gray-500 mt-1">{classes?.length ?? 0} lớp</p>
        </div>
        <CreateClassModal />
      </div>

      {(!classes || classes.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Chưa có lớp học nào</p>
          <p className="text-gray-400 text-sm mt-1">Tạo lớp đầu tiên bằng nút bên trên</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls: any) => (
            <Link key={cls.id} href={`/admin/classes/${cls.id}`}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{cls.name}</h3>
              {cls.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cls.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{(cls.class_members as any)?.[0]?.count ?? 0} học viên</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{(cls.class_assignments as any)?.[0]?.count ?? 0} bài tập</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

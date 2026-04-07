'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, BookOpen, UserPlus, Plus, Trash2, ChevronLeft } from 'lucide-react'
import { addMember, removeMember, addAssignmentToClass, removeAssignmentFromClass } from '../actions'

interface Props {
  cls: { id: string; name: string; description: string }
  members: { id: string; full_name: string; email: string; status: string }[]
  classAssignments: { id: string; title: string; due_date: string }[]
  availableStudents: { id: string; full_name: string; email: string }[]
  availableAssignments: { id: string; title: string; due_date: string }[]
}

export default function ClassDetailClient({
  cls, members: initMembers, classAssignments: initAssignments,
  availableStudents: initAvailStudents, availableAssignments: initAvailAssignments,
}: Props) {
  const [tab, setTab]                       = useState<'members' | 'assignments'>('members')
  const [members, setMembers]               = useState(initMembers)
  const [assignments, setAssignments]       = useState(initAssignments)
  const [availStudents, setAvailStudents]   = useState(initAvailStudents)
  const [availAssignments, setAvailAssign]  = useState(initAvailAssignments)
  const [loading, setLoading]               = useState('')

  async function handleAddMember(userId: string, student: any) {
    setLoading('add-' + userId)
    await addMember(cls.id, userId)
    setMembers(m => [...m, student])
    setAvailStudents(s => s.filter(x => x.id !== userId))
    setLoading('')
  }

  async function handleRemoveMember(userId: string) {
    setLoading('rem-' + userId)
    await removeMember(cls.id, userId)
    const student = members.find(m => m.id === userId)!
    setMembers(m => m.filter(x => x.id !== userId))
    setAvailStudents(s => [...s, student])
    setLoading('')
  }

  async function handleAddAssignment(assignmentId: string, assignment: any) {
    setLoading('add-a-' + assignmentId)
    await addAssignmentToClass(cls.id, assignmentId)
    setAssignments(a => [...a, assignment])
    setAvailAssign(a => a.filter(x => x.id !== assignmentId))
    setLoading('')
  }

  async function handleRemoveAssignment(assignmentId: string) {
    setLoading('rem-a-' + assignmentId)
    await removeAssignmentFromClass(cls.id, assignmentId)
    const assignment = assignments.find(a => a.id === assignmentId)!
    setAssignments(a => a.filter(x => x.id !== assignmentId))
    setAvailAssign(a => [...a, assignment])
    setLoading('')
  }

  return (
    <div className="p-8">
      {/* Back + Header */}
      <div className="mb-8">
        <Link href="/admin/classes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 w-fit">
          <ChevronLeft size={16} /> Danh sách lớp
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        {cls.description && <p className="text-gray-500 text-sm mt-1">{cls.description}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(['members', 'assignments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'members' ? <Users size={15} /> : <BookOpen size={15} />}
            {t === 'members' ? `Học viên (${members.length})` : `Bài tập (${assignments.length})`}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current members */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Học viên trong lớp</h3>
            </div>
            {members.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Chưa có học viên</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-700 text-xs font-semibold">{m.full_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.full_name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveMember(m.id)}
                      disabled={loading === 'rem-' + m.id}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available students */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Thêm học viên vào lớp</h3>
            </div>
            {availStudents.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Tất cả học viên đã trong lớp</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {availStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                    <button onClick={() => handleAddMember(s.id, s)}
                      disabled={loading === 'add-' + s.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-40">
                      <UserPlus size={13} /> Thêm
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current assignments */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Bài tập đã giao cho lớp</h3>
            </div>
            {assignments.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Chưa có bài tập nào</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      {a.due_date && (
                        <p className="text-xs text-gray-400">
                          Hạn: {new Date(a.due_date).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleRemoveAssignment(a.id)}
                      disabled={loading === 'rem-a-' + a.id}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available assignments */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Giao thêm bài tập</h3>
            </div>
            {availAssignments.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Tất cả bài tập đã được giao</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {availAssignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      {a.due_date && (
                        <p className="text-xs text-gray-400">
                          Hạn: {new Date(a.due_date).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleAddAssignment(a.id, a)}
                      disabled={loading === 'add-a-' + a.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-40">
                      <Plus size={13} /> Giao
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

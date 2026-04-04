'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAssignment } from './actions'
import { Trash2 } from 'lucide-react'

interface Props { id: string; title: string }

export default function DeleteAssignmentBtn({ id, title }: Props) {
  const [isPending, start] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm(`Xoá bài tập "${title}"? Hành động không thể hoàn tác.`)) return
    start(async () => {
      await deleteAssignment(id)
      router.refresh()
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending}
      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
      <Trash2 size={15}/>
    </button>
  )
}

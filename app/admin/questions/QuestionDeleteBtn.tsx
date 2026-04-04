'use client'

import { useTransition } from 'react'
import { deleteQuestion } from './actions'
import { Trash2 } from 'lucide-react'

interface Props { id: string; onDone: () => void }

export default function QuestionDeleteBtn({ id, onDone }: Props) {
  const [isPending, start] = useTransition()

  function handleDelete() {
    if (!confirm('Xoá câu hỏi này? Hành động không thể hoàn tác.')) return
    start(async () => { await deleteQuestion(id); onDone() })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} title="Xoá câu hỏi"
      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
      <Trash2 size={15}/>
    </button>
  )
}

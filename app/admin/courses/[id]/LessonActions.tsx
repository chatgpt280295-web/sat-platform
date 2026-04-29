'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { MoveUp, MoveDown, Pencil, Trash2, Loader2 } from 'lucide-react'
import { moveLessonPosition, deleteLesson } from '../actions'

export default function LessonActions({
  lessonId, courseId, isFirst, isLast,
}: {
  lessonId: string; courseId: string; isFirst: boolean; isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition()

  function move(dir: 'up' | 'down') {
    startTransition(() => moveLessonPosition(lessonId, courseId, dir))
  }

  function remove() {
    if (!confirm('Xóa bài học này?')) return
    startTransition(() => deleteLesson(lessonId, courseId))
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {isPending ? <Loader2 size={13} className="animate-spin text-gray-400" /> : (
        <>
          <button onClick={() => move('up')} disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <MoveUp size={13} />
          </button>
          <button onClick={() => move('down')} disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <MoveDown size={13} />
          </button>
          <Link href={`/admin/courses/${courseId}/lessons/${lessonId}/edit`}
            className="p-1 text-gray-400 hover:text-blue-600">
            <Pencil size={13} />
          </Link>
          <button onClick={remove} className="p-1 text-gray-400 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  )
}

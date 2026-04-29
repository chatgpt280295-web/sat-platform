'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { markLessonComplete } from './actions'

export default function MarkCompleteBtn({
  userId,
  lessonId,
  courseId,
}: {
  userId: string
  lessonId: string
  courseId: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      await markLessonComplete(userId, lessonId, courseId)
      router.refresh()
    })
  }

  return (
    <button onClick={handleClick} disabled={isPending}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors disabled:opacity-50">
      {isPending
        ? <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
        : <><CheckCircle size={16} /> Đánh dấu hoàn thành</>
      }
    </button>
  )
}

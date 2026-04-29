'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { togglePublishCourse } from '../actions'

export default function PublishToggle({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [published, setPublished] = useState(isPublished)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      await togglePublishCourse(courseId, !published)
      setPublished(p => !p)
    })
  }

  return (
    <button onClick={toggle} disabled={isPending}
      className={`btn-secondary text-sm gap-2 ${published ? 'border-green-200 text-green-700 hover:bg-green-50' : ''}`}>
      {isPending ? <Loader2 size={14} className="animate-spin" /> :
        published ? <EyeOff size={14} /> : <Eye size={14} />}
      {published ? 'Ẩn khóa học' : 'Hiển thị'}
    </button>
  )
}

'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { removeFromCart } from './actions'

export default function RemoveFromCartBtn({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => removeFromCart(courseId))}
      disabled={isPending}
      className="text-gray-400 hover:text-red-500 transition-colors p-1.5"
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </button>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props { text: string; className?: string }

export function KaTeX({ text, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = parseAndRender(text)
  }, [text])

  return <div ref={ref} className={className} />
}

function parseAndRender(text: string): string {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/)
  return parts.map(part => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false }) }
      catch { return part }
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      try { return katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false }) }
      catch { return part }
    }
    return part.replace(/\n/g, '<br/>')
  }).join('')
}

export function KaTeXPreview({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
      <KaTeX text={text} />
    </div>
  )
}

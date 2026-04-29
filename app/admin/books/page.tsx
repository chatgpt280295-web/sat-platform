'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState, useTransition, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, Loader2, BookOpen } from 'lucide-react'
import { createBook, deleteBook } from './actions'
import { createClient } from '@/lib/supabase/client'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminBooksPage() {
  const [books, setBooks]       = useState<any[]>([])
  const [courses, setCourses]   = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.from('book_recommendations')
      .select('*, course:courses(name)')
      .order('position')
      .then(({ data }) => setBooks(data ?? []))

    sb.from('courses')
      .select('id, name, subject')
      .eq('is_published', true)
      .order('subject').order('level')
      .then(({ data }) => setCourses(data ?? []))
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await createBook(formData)
        const { data } = await createClient()
          .from('book_recommendations')
          .select('*, course:courses(name)')
          .order('position')
        setBooks(data ?? [])
        setShowForm(false)
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi tạo')
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa gợi ý sách này?')) return
    startTransition(async () => {
      await deleteBook(id)
      setBooks(b => b.filter(x => x.id !== id))
    })
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sách gợi ý</h1>
          <p className="page-subtitle">Hiển thị cho học viên sau quiz điểm thấp</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Thêm sách
        </button>
      </div>

      {/* ── Add form ──────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Thêm sách mới</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tên sách *</label>
                <input name="title" className="input" placeholder="The Official SAT Study Guide" required />
              </div>
              <div>
                <label className="label">Tác giả</label>
                <input name="author" className="input" placeholder="College Board" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Môn học</label>
                <select name="subject" className="input">
                  <option value="">Tất cả</option>
                  <option value="math">Toán SAT</option>
                  <option value="english">Tiếng Anh SAT</option>
                </select>
              </div>
              <div>
                <label className="label">Gắn với khóa học</label>
                <select name="course_id" className="input">
                  <option value="">Không gắn</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Mô tả</label>
              <textarea name="description" className="input min-h-[60px] resize-y" placeholder="Cuốn sách phù hợp với học viên Level 1..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Link mua sách</label>
                <input name="url" type="url" className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Thứ tự hiển thị</label>
                <input name="position" type="number" className="input" defaultValue="0" />
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}

            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={isPending}>
                {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
                Lưu
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Books list ────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sách</th>
                <th>Tác giả</th>
                <th>Môn</th>
                <th>Khóa học</th>
                <th>Link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Chưa có sách nào. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Thêm ngay</button>
                  </td>
                </tr>
              ) : books.map(book => (
                <tr key={book.id}>
                  <td>
                    <div className="font-medium text-gray-900">{book.title}</div>
                    {book.description && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{book.description}</div>}
                  </td>
                  <td className="text-gray-600">{book.author ?? '—'}</td>
                  <td>
                    {book.subject ? (
                      <span className={book.subject === 'math' ? 'subject-badge-math' : 'subject-badge-english'}>
                        {book.subject === 'math' ? 'Toán' : 'Tiếng Anh'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-sm text-gray-600">{book.course?.name ?? 'Tất cả'}</td>
                  <td>
                    {book.url ? (
                      <a href={book.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
                        <ExternalLink size={12} /> Xem
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <button onClick={() => handleDelete(book.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

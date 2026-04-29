'use client'

// ── Imports ────────────────────────────────────────────────────────────────────
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import { createLesson } from '../../../actions'
import { createClient } from '@/lib/supabase/client'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewLessonPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [videoType, setVideoType] = useState<'youtube' | 'upload' | 'url'>('youtube')
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`

    const { data, error: uploadError } = await supabase.storage
      .from('lesson-videos')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError(`Lỗi upload: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('lesson-videos')
      .getPublicUrl(data.path)

    setUploadedUrl(publicUrl)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    if (videoType === 'upload' && uploadedUrl) {
      formData.set('video_url', uploadedUrl)
    }

    startTransition(async () => {
      try {
        await createLesson(params.id, formData)
        router.push(`/admin/courses/${params.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi khi tạo bài học')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/courses/${params.id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={15} /> Quay lại khóa học
        </Link>
        <h1 className="page-title">Thêm bài học mới</h1>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Tiêu đề bài học *</label>
            <input name="title" className="input" placeholder="Ví dụ: Đại số tuyến tính — Bài 1" required />
          </div>

          <div>
            <label className="label">Mô tả</label>
            <textarea name="description" className="input min-h-[80px] resize-y" placeholder="Nội dung chính của bài học..." />
          </div>

          {/* Video type selector */}
          <div>
            <label className="label">Loại video *</label>
            <input type="hidden" name="video_type" value={videoType} />
            <div className="grid grid-cols-3 gap-2">
              {(['youtube', 'upload', 'url'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVideoType(type)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    videoType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type === 'youtube' ? '▶ YouTube' : type === 'upload' ? '📁 Upload' : '🔗 URL'}
                </button>
              ))}
            </div>
          </div>

          {/* Video input based on type */}
          {videoType === 'youtube' && (
            <div>
              <label className="label">YouTube URL *</label>
              <input name="video_url" type="url" className="input" placeholder="https://www.youtube.com/watch?v=..." required />
              <p className="text-xs text-gray-400 mt-1">Nên để chế độ Unlisted trên YouTube</p>
            </div>
          )}

          {videoType === 'url' && (
            <div>
              <label className="label">URL video trực tiếp *</label>
              <input name="video_url" type="url" className="input" placeholder="https://example.com/video.mp4" required />
            </div>
          )}

          {videoType === 'upload' && (
            <div>
              <label className="label">Upload video</label>
              {uploadedUrl ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-green-700 text-sm">✓ Upload thành công</span>
                  <button type="button" onClick={() => setUploadedUrl('')}
                    className="text-xs text-red-500 hover:underline ml-auto">Xóa</button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 font-medium text-sm hover:underline">Chọn file video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI (tối đa 500MB)</p>
                  {uploading && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600">
                      <Loader2 size={14} className="animate-spin" /> Đang upload...
                    </div>
                  )}
                </div>
              )}
              <input type="hidden" name="video_url" value={uploadedUrl} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Thời lượng (phút)</label>
              <input name="duration_s" type="number" min="0" className="input" placeholder="15"
                onChange={e => {
                  const input = e.currentTarget
                  input.value = e.target.value
                }}
                onBlur={e => {
                  // Convert minutes to seconds on save
                  const minutes = parseInt(e.target.value)
                  if (!isNaN(minutes)) {
                    e.target.value = String(minutes * 60)
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" name="is_free" value="true" id="is_free"
                className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <label htmlFor="is_free" className="text-sm text-gray-700 font-medium cursor-pointer">
                Cho xem thử miễn phí
              </label>
            </div>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={isPending || uploading}>
              {isPending ? <><Loader2 size={15} className="animate-spin" /> Đang lưu...</> : 'Thêm bài học'}
            </button>
            <Link href={`/admin/courses/${params.id}`} className="btn-secondary">Hủy</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

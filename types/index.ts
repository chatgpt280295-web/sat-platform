// ── User types ────────────────────────────────────────────────────────────────
export type UserRole   = 'admin' | 'student'
export type UserStatus = 'active' | 'inactive'
export type Tier       = 1 | 2 | 3 | 4

export interface User {
  id: string
  auth_id: string
  email: string
  full_name: string
  role: UserRole
  status: UserStatus
  tier?: Tier
  phone?: string
  created_at: string
  updated_at: string
}

// ── Course types ──────────────────────────────────────────────────────────────
export type Subject     = 'math' | 'english'
export type CourseLevel = 1 | 2 | 3

export interface Course {
  id: string
  name: string
  description?: string | null
  subject?: Subject | null
  level?: CourseLevel | null
  price?: number | null
  thumbnail_url?: string | null
  is_published?: boolean
  created_at: string
  updated_at?: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  expires_at?: string | null
  enrolled_via?: 'purchase' | 'admin' | 'free'
  paid_at?: string | null
  created_at: string
  course?: Course
  user?: User
}

// ── Lesson types ──────────────────────────────────────────────────────────────
export type VideoType = 'youtube' | 'upload' | 'url'

export interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string | null
  video_url?: string | null
  video_type: VideoType
  duration_s?: number | null
  position: number
  is_free: boolean
  created_at: string
  updated_at: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  completed_at: string
}

// ── Order types ───────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  total_price: number
  payment_method: string
  payment_proof_url?: string | null
  admin_note?: string | null
  paid_at?: string | null
  created_at: string
  updated_at: string
  user?: User
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  course_id: string
  price: number
  created_at: string
  course?: Course
}

export interface CartItem {
  id: string
  user_id: string
  course_id: string
  added_at: string
  course?: Course
}

// ── Recommendation types ──────────────────────────────────────────────────────
export interface BookRecommendation {
  id: string
  course_id?: string | null
  skill?: string | null
  subject?: Subject | null
  title: string
  author?: string | null
  description?: string | null
  url?: string | null
  image_url?: string | null
  position: number
  created_at: string
}

export interface TeacherContactRequest {
  id: string
  user_id: string
  course_id?: string | null
  session_id?: string | null
  message?: string | null
  status: 'pending' | 'contacted' | 'resolved'
  admin_note?: string | null
  created_at: string
}

// ── Question types ────────────────────────────────────────────────────────────
export interface Question {
  id: string
  domain: 'Math' | 'Reading & Writing'
  skill: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  source?: string
  content: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  image_url?: string
  is_intake?: boolean
  created_at: string
  updated_at: string
}

// ── Assignment / Quiz types ───────────────────────────────────────────────────
export interface Assignment {
  id: string
  title: string
  description?: string | null
  course_id?: string | null
  due_date?: string | null
  passing_score: number
  quiz_type: 'quiz' | 'intake' | 'practice'
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const MATH_SKILLS = [
  'Algebra',
  'Advanced Math',
  'Problem-Solving and Data Analysis',
  'Geometry and Trigonometry',
] as const

export const RW_SKILLS = [
  'Information and Ideas',
  'Craft and Structure',
  'Expression of Ideas',
  'Standard English Conventions',
] as const

export const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — Foundation',
  2: 'Tier 2 — Developing',
  3: 'Tier 3 — Proficient',
  4: 'Tier 4 — Advanced',
}

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  1: 'Cơ Bản',
  2: 'Trung Cấp',
  3: 'Nâng Cao',
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  math:    'Toán SAT',
  english: 'Tiếng Anh SAT',
}

// Score → recommended level mapping (for intake result)
export function scoreToLevel(score: number): CourseLevel {
  if (score <= 450) return 1
  if (score <= 650) return 2
  return 3
}

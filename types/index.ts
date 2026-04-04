export type UserRole = 'admin' | 'student'
export type UserStatus = 'active' | 'inactive'
export type Tier = 1 | 2 | 3 | 4

export interface User {
  id: string
  auth_id: string
  email: string
  full_name: string
  role: UserRole
  status: UserStatus
  tier?: Tier
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  expires_at?: string
  created_at: string
  course?: Course
  user?: User
}

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
  created_at: string
  updated_at: string
}

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

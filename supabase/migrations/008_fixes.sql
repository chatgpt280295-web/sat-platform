-- ── Migration 008: Post-class-removal fixes ───────────────────────────────────
-- Fixes tables and columns broken/missing after 006_remove_classes migration

-- 1. progress_reports table (referenced by admin/reports/actions.ts but never created)
CREATE TABLE IF NOT EXISTS progress_reports (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_comment  text,
  recommendations  text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_reports"   ON progress_reports FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "student_own_reports" ON progress_reports FOR SELECT USING (user_id = get_my_user_id());

-- 2. diagnostic_results: add total_score column + unique constraint per subject
--    (allows per-subject intake to store math and english separately)
ALTER TABLE diagnostic_results ADD COLUMN IF NOT EXISTS total_score numeric;
ALTER TABLE diagnostic_results
  DROP CONSTRAINT IF EXISTS uniq_diag_user_subject;
ALTER TABLE diagnostic_results
  ADD CONSTRAINT uniq_diag_user_subject UNIQUE (user_id, subject);

-- 3. questions: is_intake flag (may already exist from manual setup)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_intake boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_questions_is_intake
  ON questions(is_intake) WHERE is_intake = true;

-- 4. enrollments: enrolled_at column
--    (student/courses/page.tsx selects enrolled_at but schema only has created_at)
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrolled_at timestamptz;
UPDATE enrollments SET enrolled_at = created_at WHERE enrolled_at IS NULL;

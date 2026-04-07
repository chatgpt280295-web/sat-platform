-- =====================================================
-- Phase 3 Migration: M05 Error Analysis + M06 Reports
-- Drop + recreate để tránh lỗi cột còn sót từ lần chạy trước
-- =====================================================

-- 1. error_logs
-- -------------------------------------------------------
DROP TABLE IF EXISTS error_logs CASCADE;

CREATE TABLE error_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id    uuid REFERENCES sessions(id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES assignments(id) ON DELETE SET NULL,
  domain        text,
  skill         text,
  chosen_answer text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX error_logs_user_id_idx  ON error_logs(user_id);
CREATE INDEX error_logs_session_idx  ON error_logs(session_id);
CREATE INDEX error_logs_skill_idx    ON error_logs(skill);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_error_logs ON error_logs
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY student_own_error_logs ON error_logs
  FOR SELECT TO authenticated
  USING (user_id = get_my_user_id());

-- 2. progress_reports
-- -------------------------------------------------------
DROP TABLE IF EXISTS progress_reports CASCADE;

CREATE TABLE progress_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_comment  text DEFAULT '',
  recommendations  text DEFAULT '',
  period_start     date,
  period_end       date,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_progress_reports ON progress_reports
  FOR ALL TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY student_own_progress_reports ON progress_reports
  FOR SELECT TO authenticated
  USING (user_id = get_my_user_id());

-- Verify
SELECT 'error_logs OK' AS status, COUNT(*) FROM error_logs
UNION ALL
SELECT 'progress_reports OK', COUNT(*) FROM progress_reports;

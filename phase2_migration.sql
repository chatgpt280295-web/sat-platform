-- ================================================================
-- SAT PLATFORM — PHASE 2 MIGRATION
-- M04: Điểm danh | M02: Intake & Phân tier
-- Chạy trong Supabase SQL Editor
-- ================================================================

-- ── 1. CLASS_SESSIONS (buổi học để điểm danh) ────────────────────
CREATE TABLE IF NOT EXISTS class_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id      UUID REFERENCES classes(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  session_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  opens_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Xóa và tạo lại ATTENDANCES (gắn với class_sessions) ───────
DROP TABLE IF EXISTS attendances CASCADE;

CREATE TABLE attendances (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'present'
                   CHECK (status IN ('present', 'late', 'absent')),
  checked_in_at  TIMESTAMPTZ,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- ── 3. INTAKE_SURVEYS (thông tin ban đầu học sinh) ────────────────
CREATE TABLE IF NOT EXISTS intake_surveys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  school          TEXT,
  grade           TEXT,
  english_level   TEXT CHECK (english_level IN ('A1','A2','B1','B2','C1','C2')),
  sat_target      INT,
  hours_per_week  INT,
  strengths       TEXT,
  completed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. RLS ────────────────────────────────────────────────────────
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_surveys ENABLE ROW LEVEL SECURITY;

-- class_sessions: admin full, student read own class
DROP POLICY IF EXISTS "admin_all_class_sessions"   ON class_sessions;
DROP POLICY IF EXISTS "student_read_class_sessions" ON class_sessions;
CREATE POLICY "admin_all_class_sessions"
  ON class_sessions FOR ALL TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "student_read_class_sessions"
  ON class_sessions FOR SELECT TO authenticated
  USING (
    get_my_role() = 'student' AND
    class_id IN (SELECT class_id FROM class_members WHERE user_id = get_my_user_id())
  );

-- attendances: admin full, student read own
DROP POLICY IF EXISTS "admin_all_attendances"   ON attendances;
DROP POLICY IF EXISTS "student_own_attendance"  ON attendances;
CREATE POLICY "admin_all_attendances"
  ON attendances FOR ALL TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "student_own_attendance"
  ON attendances FOR SELECT TO authenticated
  USING (get_my_role() = 'student' AND user_id = get_my_user_id());

-- intake_surveys: admin read all, student own
DROP POLICY IF EXISTS "admin_read_intake_surveys"  ON intake_surveys;
DROP POLICY IF EXISTS "student_own_intake_survey"  ON intake_surveys;
CREATE POLICY "admin_read_intake_surveys"
  ON intake_surveys FOR ALL TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "student_own_intake_survey"
  ON intake_surveys FOR ALL TO authenticated
  USING (get_my_role() = 'student' AND user_id = get_my_user_id());

-- diagnostic_results: keep existing + add policy if missing
DROP POLICY IF EXISTS "admin_all_diagnostic"    ON diagnostic_results;
DROP POLICY IF EXISTS "student_own_diagnostic"  ON diagnostic_results;
CREATE POLICY "admin_all_diagnostic"
  ON diagnostic_results FOR ALL TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "student_own_diagnostic"
  ON diagnostic_results FOR ALL TO authenticated
  USING (get_my_role() = 'student' AND user_id = get_my_user_id());

-- ── 5. Kiểm tra ──────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('class_sessions','attendances','intake_surveys','diagnostic_results')
ORDER BY table_name;

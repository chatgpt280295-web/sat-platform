-- ================================================================
-- SAT PLATFORM — MIGRATION: Thêm tính năng Lớp học
-- Chạy trong Supabase SQL Editor
-- ================================================================

-- ── 1. CLASSES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. CLASS_MEMBERS (học sinh thuộc lớp nào) ────────────────────
CREATE TABLE IF NOT EXISTS class_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- ── 3. CLASS_ASSIGNMENTS (bài tập giao cho lớp) ──────────────────
CREATE TABLE IF NOT EXISTS class_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id      UUID NOT NULL REFERENCES classes(id)      ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id)  ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, assignment_id)
);

-- ── 4. RLS ───────────────────────────────────────────────────────
ALTER TABLE classes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_classes"
  ON classes FOR ALL TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "admin_all_class_members"
  ON class_members FOR ALL TO authenticated
  USING (get_my_role() = 'admin');

CREATE POLICY "admin_all_class_assignments"
  ON class_assignments FOR ALL TO authenticated
  USING (get_my_role() = 'admin');

-- Student: chỉ đọc lớp của mình
CREATE POLICY "student_read_own_classes"
  ON classes FOR SELECT TO authenticated
  USING (
    get_my_role() = 'student' AND
    id IN (
      SELECT class_id FROM class_members
      WHERE user_id = get_my_user_id()
    )
  );

CREATE POLICY "student_read_own_membership"
  ON class_members FOR SELECT TO authenticated
  USING (
    get_my_role() = 'student' AND
    user_id = get_my_user_id()
  );

CREATE POLICY "student_read_class_assignments"
  ON class_assignments FOR SELECT TO authenticated
  USING (
    get_my_role() = 'student' AND
    class_id IN (
      SELECT class_id FROM class_members
      WHERE user_id = get_my_user_id()
    )
  );

-- ── 5. Kiểm tra ──────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('classes','class_members','class_assignments')
ORDER BY table_name;

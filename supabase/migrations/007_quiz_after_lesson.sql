-- Link a quiz to a specific lesson (quiz appears right after that lesson)
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS after_lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL;

-- Index for quick lookup: "which quiz follows this lesson?"
CREATE INDEX IF NOT EXISTS idx_assignments_after_lesson ON assignments(after_lesson_id)
  WHERE after_lesson_id IS NOT NULL;

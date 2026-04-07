-- Lưu từng câu trả lời của bài kiểm tra đầu vào
CREATE TABLE IF NOT EXISTS intake_answers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  chosen_answer   text CHECK (chosen_answer IN ('A', 'B', 'C', 'D')),
  is_correct      boolean,
  created_at      timestamptz DEFAULT now()
);

-- Xóa dữ liệu cũ khi học viên làm lại
CREATE UNIQUE INDEX IF NOT EXISTS intake_answers_user_question_idx
  ON intake_answers (user_id, question_id);

-- RLS
ALTER TABLE intake_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_intake_answers"   ON intake_answers FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "student_own_intake_answers" ON intake_answers FOR SELECT USING (user_id = get_my_user_id());

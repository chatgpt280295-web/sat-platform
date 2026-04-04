-- ================================================================
-- SAT PLATFORM — DỮ LIỆU MẪU ĐỂ TEST
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- ================================================================
-- Schema thực tế: questions có cột domain, skill, difficulty
-- domain: 'Math' | 'Reading & Writing'
-- difficulty: 'Easy' | 'Medium' | 'Hard'
-- ================================================================


-- ── 1. COURSES ───────────────────────────────────────────────────
INSERT INTO courses (name, description) VALUES
  ('SAT Math — Nền tảng',   'Algebra, Linear Equations, Data Analysis cơ bản'),
  ('SAT Math — Nâng cao',   'Advanced Math, Geometry, Trigonometry'),
  ('SAT Reading & Writing', 'Reading Comprehension, Grammar, Vocabulary in Context')
ON CONFLICT DO NOTHING;


-- ── 2. QUESTIONS — Math ──────────────────────────────────────────
INSERT INTO questions
  (domain, skill, difficulty, content, option_a, option_b, option_c, option_d, correct_answer, explanation)
VALUES
(
  'Math', 'Algebra', 'Easy',
  'Nếu $3x + 7 = 22$, giá trị của $x$ là bao nhiêu?',
  '3', '5', '7', '9',
  'B',
  'Giải: $3x = 22 - 7 = 15 \Rightarrow x = 5$'
),
(
  'Math', 'Algebra', 'Easy',
  'Đường thẳng đi qua hai điểm $(2,\,3)$ và $(4,\,7)$. Hệ số góc của đường thẳng là bao nhiêu?',
  '1', '2', '3', '4',
  'B',
  'Hệ số góc $= \dfrac{7-3}{4-2} = \dfrac{4}{2} = 2$'
),
(
  'Math', 'Advanced Math', 'Medium',
  'Hàm số $f(x) = 2x^2 - 8x + 6$. Giá trị nhỏ nhất của $f(x)$ là bao nhiêu?',
  '$-2$', '$-8$', '$6$', '$2$',
  'A',
  'Đỉnh parabol tại $x = \frac{8}{4} = 2$. $f(2) = 8 - 16 + 6 = -2$'
),
(
  'Math', 'Algebra', 'Medium',
  'Nếu $\dfrac{2x-1}{3} = \dfrac{x+4}{2}$, thì $x$ bằng bao nhiêu?',
  '$10$', '$11$', '$14$', '$15$',
  'C',
  'Cross-multiply: $2(2x-1) = 3(x+4) \Rightarrow 4x-2 = 3x+12 \Rightarrow x = 14$'
),
(
  'Math', 'Geometry', 'Easy',
  'Một hình chữ nhật có chu vi $36$ cm và chiều dài gấp đôi chiều rộng. Diện tích hình chữ nhật là bao nhiêu?',
  '$72\ \text{cm}^2$', '$96\ \text{cm}^2$', '$108\ \text{cm}^2$', '$144\ \text{cm}^2$',
  'A',
  'Gọi rộng $= w$, dài $= 2w$. Chu vi $= 6w = 36 \Rightarrow w = 6$. Diện tích $= 6 \times 12 = 72$'
),
(
  'Math', 'Data Analysis', 'Easy',
  'Trong một lớp học, tỉ lệ học sinh nữ so với học sinh nam là $3:2$. Nếu có $30$ học sinh nữ, lớp có bao nhiêu học sinh nam?',
  '$15$', '$18$', '$20$', '$25$',
  'C',
  'Tỉ lệ $3:2$, nữ $= 30 \Rightarrow$ nam $= 30 \times \frac{2}{3} = 20$'
),
(
  'Math', 'Algebra', 'Medium',
  'Cho hệ phương trình: $2x + y = 8$ và $x - y = 1$. Giá trị của $x + y$ là?',
  '$4$', '$5$', '$6$', '$7$',
  'B',
  'Cộng 2 phương trình: $3x = 9 \Rightarrow x = 3$. Từ PT2: $y = 2$. Vậy $x + y = 5$'
),
(
  'Math', 'Data Analysis', 'Easy',
  'Doanh thu tăng từ $120{,}000$ lên $150{,}000$ trong một năm. Phần trăm tăng trưởng là bao nhiêu?',
  '$20\%$', '$25\%$', '$30\%$', '$35\%$',
  'B',
  'Tăng trưởng $= \frac{30000}{120000} \times 100 = 25\%$'
);


-- ── 3. QUESTIONS — Reading & Writing ─────────────────────────────
INSERT INTO questions
  (domain, skill, difficulty, content, option_a, option_b, option_c, option_d, correct_answer, explanation)
VALUES
(
  'Reading & Writing', 'Words in Context', 'Medium',
  'Choose the word that best completes the sentence:
"The scientist''s findings were ______; they contradicted decades of established research."',
  'conventional', 'controversial', 'comprehensive', 'conservative',
  'B',
  '"Controversial" (gây tranh cãi) phù hợp nhất — kết quả mâu thuẫn với nghiên cứu đã được công nhận.'
),
(
  'Reading & Writing', 'Information and Ideas', 'Easy',
  'Read the passage: "Despite centuries of scientific progress, the ocean remains largely unexplored. Less than 20 percent of the ocean floor has been mapped."

Which claim is best supported by the passage?',
  'The ocean has been fully mapped using modern technology.',
  'Scientific progress has made ocean exploration unnecessary.',
  'Much of the ocean is still unknown to scientists.',
  'The ocean floor is impossible to explore.',
  'C',
  'Đoạn văn nói "less than 20 percent has been mapped" → phần lớn đại dương vẫn chưa được khám phá.'
),
(
  'Reading & Writing', 'Standard English Conventions', 'Easy',
  'Which revision best improves the sentence?
"The committee have decided to postpone their meeting, which is scheduled for next Tuesday."',
  'committee have decided',
  'committee has decided',
  'committee were deciding',
  'committee decided having',
  'B',
  '"Committee" là collective noun → dùng động từ số ít: "has decided".'
),
(
  'Reading & Writing', 'Transitions', 'Medium',
  'Which transition word best fills the blank?
"The weather forecast predicted heavy rain; ______, the outdoor event proceeded as planned."',
  'therefore', 'furthermore', 'nevertheless', 'similarly',
  'C',
  '"Nevertheless" (dù vậy) thể hiện sự tương phản giữa dự báo mưa và sự kiện vẫn diễn ra.'
),
(
  'Reading & Writing', 'Words in Context', 'Hard',
  'The word "ephemeral" in the passage most nearly means:',
  'permanent', 'short-lived', 'significant', 'ancient',
  'B',
  '"Ephemeral" = tồn tại trong thời gian ngắn (short-lived). VD: "ephemeral beauty of cherry blossoms".'
),
(
  'Reading & Writing', 'Rhetorical Synthesis', 'Medium',
  'A student wants to add evidence supporting: "Regular exercise improves mental health."
Which sentence best accomplishes this?',
  'Many people enjoy going to the gym after work.',
  'Studies show 30 minutes of daily exercise reduces anxiety and depression by up to 40%.',
  'Exercise equipment can be expensive to purchase.',
  'Some people prefer outdoor activities over indoor ones.',
  'B',
  'Chỉ đáp án B cung cấp số liệu cụ thể (40%) trực tiếp hỗ trợ luận điểm về sức khỏe tâm thần.'
);


-- ── 4. ASSIGNMENTS ───────────────────────────────────────────────
INSERT INTO assignments (title, description, due_date) VALUES
  (
    'Kiểm tra Algebra cơ bản',
    'Các dạng toán Algebra: phương trình bậc nhất, hệ phương trình, đường thẳng.',
    NOW() + INTERVAL '7 days'
  ),
  (
    'SAT Reading & Writing — Lần 1',
    'Luyện tập Grammar, Vocabulary in Context và Reading Comprehension.',
    NOW() + INTERVAL '14 days'
  ),
  (
    'Bài tập tổng hợp Math + Reading',
    'Kết hợp cả Math và Reading để luyện thi SAT toàn diện.',
    NOW() + INTERVAL '21 days'
  );


-- ── 5. ASSIGNMENT_QUESTIONS ──────────────────────────────────────

-- Bài 1: 5 câu Math
WITH
  a1 AS (SELECT id FROM assignments WHERE title = 'Kiểm tra Algebra cơ bản' LIMIT 1),
  qs AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS pos
    FROM questions WHERE domain = 'Math' LIMIT 5
  )
INSERT INTO assignment_questions (assignment_id, question_id, position)
SELECT a1.id, qs.id, qs.pos FROM qs, a1;

-- Bài 2: 5 câu Reading & Writing
WITH
  a2 AS (SELECT id FROM assignments WHERE title = 'SAT Reading & Writing — Lần 1' LIMIT 1),
  qs AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS pos
    FROM questions WHERE domain = 'Reading & Writing' LIMIT 5
  )
INSERT INTO assignment_questions (assignment_id, question_id, position)
SELECT a2.id, qs.id, qs.pos FROM qs, a2;

-- Bài 3: Mix 4 Math + 4 Reading
WITH
  a3 AS (SELECT id FROM assignments WHERE title = 'Bài tập tổng hợp Math + Reading' LIMIT 1),
  qs AS (
    SELECT id, ROW_NUMBER() OVER () AS pos
    FROM (
      (SELECT id FROM questions WHERE domain = 'Math' ORDER BY created_at LIMIT 4)
      UNION ALL
      (SELECT id FROM questions WHERE domain = 'Reading & Writing' ORDER BY created_at LIMIT 4)
    ) sub
  )
INSERT INTO assignment_questions (assignment_id, question_id, position)
SELECT a3.id, qs.id, qs.pos FROM qs, a3;


-- ================================================================
-- ✅ Kiểm tra kết quả:
-- ================================================================
SELECT 'courses'               AS bảng, COUNT(*) AS số_dòng FROM courses
UNION ALL SELECT 'questions',           COUNT(*) FROM questions
UNION ALL SELECT 'assignments',         COUNT(*) FROM assignments
UNION ALL SELECT 'assignment_questions',COUNT(*) FROM assignment_questions;

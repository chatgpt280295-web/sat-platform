-- Migration: 005_course_redesign.sql
-- Mục đích: Chuyển từ mô hình lớp học sang khóa học thương mại
-- Created: 2026-04-18

-- ════════════════════════════════════════
-- 1. Mở rộng bảng hiện có
-- ════════════════════════════════════════

-- courses: thêm metadata đầy đủ
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS subject       text CHECK (subject IN ('math', 'english')),
  ADD COLUMN IF NOT EXISTS level         int  CHECK (level BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS price         numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS is_published  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

-- assignments: quiz metadata
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS passing_score int  DEFAULT 70,
  ADD COLUMN IF NOT EXISTS quiz_type     text DEFAULT 'quiz'
             CHECK (quiz_type IN ('quiz', 'intake', 'practice'));

-- users: thêm phone
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone text;

-- enrollments: tracking nguồn gốc
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS enrolled_via text DEFAULT 'purchase',
  ADD COLUMN IF NOT EXISTS paid_at      timestamptz;

-- diagnostic_results: thêm subject scope
ALTER TABLE diagnostic_results
  ADD COLUMN IF NOT EXISTS subject text CHECK (subject IN ('math', 'english', 'both'));

-- ════════════════════════════════════════
-- 2. Bảng mới
-- ════════════════════════════════════════

-- lessons: bài học trong khóa học (video)
CREATE TABLE IF NOT EXISTS lessons (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  video_url    text,
  video_type   text DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'upload', 'url')),
  duration_s   int,
  position     int NOT NULL DEFAULT 0,
  is_free      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_position  ON lessons(course_id, position);

-- lesson_progress: học viên đã hoàn thành bài nào
CREATE TABLE IF NOT EXISTS lesson_progress (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id    uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user  ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(user_id, course_id);

-- orders: đơn hàng mua khóa học
CREATE TABLE IF NOT EXISTS orders (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total_price       numeric(10,2) NOT NULL DEFAULT 0,
  payment_method    text DEFAULT 'bank_transfer',
  payment_proof_url text,
  admin_note        text,
  paid_at           timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);

-- order_items: từng khóa học trong đơn hàng
CREATE TABLE IF NOT EXISTS order_items (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  course_id  uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  price      numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- cart_items: giỏ hàng tạm thời
CREATE TABLE IF NOT EXISTS cart_items (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  added_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- book_recommendations: sách gợi ý sau quiz điểm thấp
CREATE TABLE IF NOT EXISTS book_recommendations (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   uuid REFERENCES courses(id) ON DELETE SET NULL,
  skill       text,
  subject     text CHECK (subject IN ('math', 'english')),
  title       text NOT NULL,
  author      text,
  description text,
  url         text,
  image_url   text,
  position    int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- teacher_contact_requests: đặt lịch học 1:1 với giáo viên
CREATE TABLE IF NOT EXISTS teacher_contact_requests (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   uuid REFERENCES courses(id) ON DELETE SET NULL,
  session_id  uuid REFERENCES sessions(id) ON DELETE SET NULL,
  message     text,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved')),
  admin_note  text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_user   ON teacher_contact_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON teacher_contact_requests(status);

-- ════════════════════════════════════════
-- 3. Row Level Security cho bảng mới
-- ════════════════════════════════════════

ALTER TABLE lessons                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_recommendations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_contact_requests ENABLE ROW LEVEL SECURITY;

-- lessons: public read (xem trước khi mua), admin write
CREATE POLICY "public_read_lessons"   ON lessons FOR SELECT USING (true);
CREATE POLICY "admin_write_lessons"   ON lessons FOR ALL    USING (get_my_role() = 'admin');

-- lesson_progress: admin tất cả, student chỉ của mình
CREATE POLICY "admin_all_lp"          ON lesson_progress FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "student_own_lp"        ON lesson_progress FOR ALL    USING (user_id = get_my_user_id());

-- orders: admin tất cả, student chỉ xem/tạo/update của mình
CREATE POLICY "admin_all_orders"      ON orders FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "student_own_orders_select" ON orders FOR SELECT USING (user_id = get_my_user_id());
CREATE POLICY "student_create_orders" ON orders FOR INSERT WITH CHECK (user_id = get_my_user_id());
CREATE POLICY "student_update_orders" ON orders FOR UPDATE USING (user_id = get_my_user_id() AND status = 'pending');

-- order_items: admin tất cả, student xem của mình
CREATE POLICY "admin_all_order_items"     ON order_items FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "student_own_order_items"   ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = get_my_user_id())
);
CREATE POLICY "student_create_order_items" ON order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE user_id = get_my_user_id())
);

-- cart_items: student chỉ của mình, admin tất cả
CREATE POLICY "student_own_cart"      ON cart_items FOR ALL USING (user_id = get_my_user_id());
CREATE POLICY "admin_all_cart"        ON cart_items FOR ALL USING (get_my_role() = 'admin');

-- book_recommendations: public read, admin write
CREATE POLICY "public_read_books"     ON book_recommendations FOR SELECT USING (true);
CREATE POLICY "admin_write_books"     ON book_recommendations FOR ALL   USING (get_my_role() = 'admin');

-- teacher_contact_requests: admin tất cả, student chỉ của mình
CREATE POLICY "admin_all_contact"     ON teacher_contact_requests FOR ALL    USING (get_my_role() = 'admin');
CREATE POLICY "student_own_contact"   ON teacher_contact_requests FOR SELECT USING (user_id = get_my_user_id());
CREATE POLICY "student_create_contact" ON teacher_contact_requests FOR INSERT WITH CHECK (user_id = get_my_user_id());

-- ════════════════════════════════════════
-- 4. Seed: 6 khóa học mặc định
-- ════════════════════════════════════════

INSERT INTO courses (name, subject, level, price, is_published, description) VALUES
  ('Toán SAT Cơ Bản',         'math',    1, 1500000, true,  'Nền tảng toán học SAT dành cho học viên mới bắt đầu. Ôn luyện các kỹ năng cơ bản: đại số, hình học, phân tích dữ liệu.'),
  ('Toán SAT Trung Cấp',      'math',    2, 2000000, true,  'Nâng cao kỹ năng giải toán SAT. Chinh phục các dạng bài từ 500–650 điểm.'),
  ('Toán SAT Nâng Cao',       'math',    3, 2500000, true,  'Chinh phục 700–800 điểm toán SAT. Tập trung vào Advanced Math và bài toán khó.'),
  ('Tiếng Anh SAT Cơ Bản',   'english', 1, 1500000, true,  'Nền tảng Reading & Writing SAT cho người mới. Từ vựng, ngữ pháp cơ bản, kỹ năng đọc hiểu.'),
  ('Tiếng Anh SAT Trung Cấp','english', 2, 2000000, true,  'Nâng cao kỹ năng đọc hiểu và viết SAT. Chinh phục 500–650 điểm.'),
  ('Tiếng Anh SAT Nâng Cao', 'english', 3, 2500000, true,  'Chinh phục 700–800 điểm English SAT. Phân tích văn bản phức tạp, viết luận nâng cao.')
ON CONFLICT DO NOTHING;

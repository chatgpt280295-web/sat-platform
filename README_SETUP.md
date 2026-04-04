# SAT Platform — Hướng dẫn cài đặt Phase 1

## Yêu cầu
- Node.js 18+
- Tài khoản Supabase (free): https://supabase.com
- Tài khoản Resend (free): https://resend.com
- Tài khoản Vercel (free): https://vercel.com

---

## Bước 1: Tạo Supabase Project

1. Vào https://supabase.com → New Project
2. Đặt tên project, chọn region (Singapore gần nhất)
3. Sau khi tạo xong, vào **Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` eqkxehadanlvepzzqsvf
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3hlaGFkYW5sdmVwenpxc3ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMDMyNzcsImV4cCI6MjA5MDc3OTI3N30.ANUuOSj0ikRxci3f06tQ5-SJbbWJxOMw2CM2yG30CUI
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxa3hlaGFkYW5sdmVwenpxc3ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIwMzI3NywiZXhwIjoyMDkwNzc5Mjc3fQ.UwMUOGHqoeU3LxE5bnUv9b999DBMMKob3uA9jal9NY4

---

## Bước 2: Chạy Database Migration

1. Vào Supabase Dashboard → **SQL Editor**
2. Copy toàn bộ nội dung file `supabase/migrations/001_schema.sql`
3. Paste vào SQL Editor → Run
4. Tạo 2 Storage buckets trong **Storage**:
   - `question-images` (public)
   - `submissions` (private)

---

## Bước 3: Tạo tài khoản Admin đầu tiên

Trong SQL Editor, chạy:

```sql
-- Tạo auth account cho admin (đổi email + password)
SELECT * FROM auth.users; -- kiểm tra

-- Sau khi tạo tài khoản qua Supabase Auth Dashboard (Authentication → Users → Add User),
-- ghi nhận UUID rồi thêm vào bảng users:
INSERT INTO users (auth_id, email, name, role, status)
VALUES (
  '<UUID_TU_AUTH_USERS>',
  'admin@yourdomain.com',
  'Tên Giáo Viên',
  'admin',
  'active'
);
```

Hoặc vào **Authentication → Users → Add User** trong Supabase Dashboard.

---

## Bước 4: Tạo Khóa học đầu tiên

```sql
INSERT INTO courses (name, description, teacher_id)
VALUES (
  'SAT 2026 - Khoá Hè',
  'Khóa luyện SAT chuẩn bị kỳ thi tháng 8/2026',
  '<USER_ID_CUA_ADMIN>'
);
```

---

## Bước 5: Cài đặt và chạy local

```bash
# 1. Vào thư mục project
cd sat-platform

# 2. Cài dependencies
npm install

# 3. Copy file env và điền thông tin
cp .env.example .env.local
# Mở .env.local và điền các giá trị từ Supabase + Resend

# 4. Chạy development server
npm run dev

# 5. Mở trình duyệt
# → http://localhost:3000
```

---

## Bước 6: Đăng nhập lần đầu

1. Mở http://localhost:3000 → tự redirect về `/login`
2. Đăng nhập bằng tài khoản admin vừa tạo
3. Vào **Học viên** → thêm học sinh đầu tiên
4. Vào **Câu hỏi** → import CSV hoặc thêm thủ công

---

## Bước 7: Deploy lên Vercel

```bash
# Cài Vercel CLI
npm install -g vercel

# Deploy
vercel

# Thêm environment variables trong Vercel Dashboard
# Settings → Environment Variables → thêm tất cả từ .env.example
```

---

## Cấu trúc file đã tạo (Phase 1)

```
sat-platform/
├── app/
│   ├── (auth)/login/          ← Trang đăng nhập
│   ├── (auth)/locked/         ← Trang tài khoản bị khóa
│   ├── (admin)/
│   │   ├── layout.tsx         ← Layout admin (sidebar + auth guard)
│   │   ├── dashboard/         ← Dashboard tổng quan
│   │   ├── users/             ← M01: Quản lý học viên
│   │   └── questions/         ← M03: Ngân hàng câu hỏi
│   ├── (student)/
│   │   ├── layout.tsx         ← Layout student
│   │   └── dashboard/         ← Dashboard học sinh
│   └── api/v1/               ← CSV template downloads
├── components/
│   ├── math/KaTeX.tsx         ← LaTeX renderer
│   └── shared/                ← Sidebar components
├── lib/
│   ├── supabase/              ← Client/Server/Admin helpers
│   ├── email.ts               ← Resend integration
│   └── utils.ts               ← Utilities
├── types/index.ts             ← TypeScript types
├── middleware.ts              ← Auth + role guard
└── supabase/migrations/       ← SQL schema
```

---

## Phase tiếp theo

Sau Phase 1 ổn định, tiếp tục với Phase 2:
- **M04**: Điểm danh QR code, giao bài, làm bài online, chấm điểm
- **M02**: Intake test, phân tier tự động

---

## Hỗ trợ

Nếu gặp lỗi khi chạy, kiểm tra:
1. Supabase URL và keys có đúng không
2. Migration SQL đã chạy thành công chưa (kiểm tra bảng trong Table Editor)
3. Storage buckets đã tạo chưa
4. Tài khoản admin đã có trong bảng `users` chưa

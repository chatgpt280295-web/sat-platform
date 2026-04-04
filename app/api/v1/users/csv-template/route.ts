import { NextResponse } from 'next/server'

export async function GET() {
  const csv = [
    'full_name,email,expires_at',
    'Nguyễn Văn A,student1@example.com,2025-12-31',
    'Trần Thị B,student2@example.com,',
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="students_template.csv"',
    },
  })
}

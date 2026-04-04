import { NextResponse } from 'next/server'

export async function GET() {
  const csv = [
    'domain,skill,difficulty,source,content,option_a,option_b,option_c,option_d,correct_answer,explanation',
    'Math,Algebra,Easy,SAT Practice 1,"What is 2+2?",3,4,5,6,B,"2+2 = 4"',
    'Reading & Writing,Information and Ideas,Medium,,"The author argues that...",A,B,C,D,A,""',
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="questions_template.csv"',
    },
  })
}

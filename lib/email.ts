// Email sending is disabled — stub only
// To enable: install resend, add RESEND_API_KEY to .env.local, then implement below

export async function sendWelcomeEmail(
  email: string,
  name: string,
  tempPassword: string,
): Promise<void> {
  // TODO: enable when RESEND_API_KEY is configured
  console.log('[email stub] Welcome email to:', email, '| temp pw:', tempPassword)
}

export async function sendGradeNotification(
  email: string,
  name: string,
  assignmentTitle: string,
  score: number,
  total: number,
): Promise<void> {
  // TODO: enable when RESEND_API_KEY is configured
  console.log('[email stub] Grade notification to:', email, score + '/' + total)
}

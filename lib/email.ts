// Wrapper for Resend. Falls back to console.log when RESEND_API_KEY is not set (dev mode).
import { Resend } from 'resend'
import type { ReactElement } from 'react'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM || 'Still <noreply@stilldistillery.app>'

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: ReactElement
}): Promise<void> {
  if (!resend) {
    console.log(`[Email dev] TO: ${to} | SUBJECT: ${subject}`)
    return
  }
  await resend.emails.send({ from: FROM, to, subject, react })
}

import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_APP_URL!))
  res.cookies.delete('viewing_as_distillery_id')
  res.cookies.delete('viewing_as_distillery_name')
  return res
}

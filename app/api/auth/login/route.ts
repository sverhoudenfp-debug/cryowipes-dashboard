import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('auth', process.env.AUTH_PASSWORD!, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
    path: '/',
  })

  return response
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MATCHERS = ['/admin', '/api/admin']

function isProtectedPath(pathname: string) {
  return MATCHERS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function unauthorizedResponse(message: string) {
  const response = new NextResponse(message, { status: 401 })
  response.headers.set('WWW-Authenticate', 'Basic realm="Admin Area"')
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    return new NextResponse('Admin authentication is not configured', { status: 500 })
  }

  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Basic ')) {
    return unauthorizedResponse('Authentication required')
  }

  const decoded = globalThis.atob(authorization.split(' ')[1] || '')
  const [providedUser, ...passwordParts] = decoded.split(':')
  const providedPass = passwordParts.join(':')

  if (providedUser !== username || providedPass !== password) {
    return unauthorizedResponse('Invalid credentials')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

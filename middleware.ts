/**
 * Vercel Edge Middleware
 *
 * Env vars (set in Vercel dashboard — no VITE_ prefix, server-side only):
 *   BASIC_AUTH_ENABLED   "true" to require HTTP Basic Auth
 *   BASIC_AUTH_USER      Username
 *   BASIC_AUTH_PASSWORD  Password
 */
import { next } from '@vercel/edge'

export const config = {
  matcher: ['(.*)'],
}

export default function middleware(request: Request): Response {
  if (process.env.BASIC_AUTH_ENABLED !== 'true') return next()

  const authUser = process.env.BASIC_AUTH_USER ?? ''
  const authPass = process.env.BASIC_AUTH_PASSWORD ?? ''

  const header = request.headers.get('authorization') ?? ''
  if (header.startsWith('Basic ')) {
    const decoded = atob(header.slice(6))
    const sep = decoded.indexOf(':')
    if (sep !== -1 && decoded.slice(0, sep) === authUser && decoded.slice(sep + 1) === authPass) {
      return next()
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Tekiō", charset="UTF-8"',
    },
  })
}

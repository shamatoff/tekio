/**
 * Vercel Edge Middleware
 *
 * Env vars (set in Vercel dashboard — no VITE_ prefix, server-side only):
 *   BASIC_AUTH_ENABLED   "true" to require HTTP Basic Auth
 *   BASIC_AUTH_USER      Username
 *   BASIC_AUTH_PASSWORD  Password
 */

export const config = {
  matcher: '/:path*',
}

export default function middleware(request: Request): Response | undefined {
  if (process.env.BASIC_AUTH_ENABLED !== 'true') return // disabled — pass through

  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASSWORD

  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Basic ')) {
    const decoded = atob(auth.slice(6))
    const colon = decoded.indexOf(':')
    if (
      colon !== -1 &&
      decoded.slice(0, colon) === user &&
      decoded.slice(colon + 1) === pass
    ) {
      return // authenticated — pass through
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Tekiō"',
      'Content-Type': 'text/plain',
    },
  })
}

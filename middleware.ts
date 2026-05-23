/**
 * Vercel Edge Middleware — Staging protection
 *
 * Env vars (set in Vercel dashboard — no VITE_ prefix, server-side only):
 *   BASIC_AUTH_ENABLED   "true" to show login gate
 *   BASIC_AUTH_USER      Username
 *   BASIC_AUTH_PASSWORD  Password
 *
 * NOTE: Browser native Basic Auth (WWW-Authenticate) does not work on Vercel —
 * the CDN strips that header before it reaches the browser. This middleware
 * serves a custom HTML login form and uses a session cookie instead.
 */
import { next } from '@vercel/edge'

const COOKIE = 'tekio_stg'

const loginPage = (error = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tekiō — Sign in</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100svh;
      display: flex; align-items: center; justify-content: center;
      background: #0c0c0c;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .card {
      background: #161616;
      border: 1px solid #272727;
      border-radius: 14px;
      padding: 36px 32px;
      width: min(340px, calc(100vw - 32px));
    }
    h1 { color: #f0f0f0; font-size: 22px; font-weight: 700; text-align: center; margin-bottom: 28px; letter-spacing: -0.3px; }
    label { display: block; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
    input {
      display: block; width: 100%;
      padding: 10px 12px;
      background: #0c0c0c; border: 1px solid #2e2e2e; border-radius: 8px;
      color: #f0f0f0; font-size: 15px;
      outline: none; margin-bottom: 18px;
      transition: border-color 0.15s;
    }
    input:focus { border-color: #555; }
    button {
      width: 100%; padding: 11px;
      background: #f0f0f0; color: #0c0c0c;
      border: none; border-radius: 8px;
      font-size: 15px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.85; }
    .err { color: #f87171; font-size: 13px; text-align: center; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Tekiō</h1>
    ${error ? '<p class="err">Incorrect credentials — try again.</p>' : ''}
    <form method="POST">
      <label for="u">Username</label>
      <input id="u" type="text" name="u" autocomplete="username" autofocus>
      <label for="p">Password</label>
      <input id="p" type="password" name="p" autocomplete="current-password">
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>`

export const config = {
  matcher: ['/(.*)'],
}

export default async function middleware(request: Request): Promise<Response> {
  if (process.env.BASIC_AUTH_ENABLED !== 'true') return next()

  const authUser = process.env.BASIC_AUTH_USER ?? ''
  const authPass = process.env.BASIC_AUTH_PASSWORD ?? ''
  const token = btoa(`${authUser}:${authPass}`)

  // Already authenticated via session cookie
  const cookies = request.headers.get('cookie') ?? ''
  if (cookies.split(';').some(c => c.trim() === `${COOKIE}=${token}`)) {
    return next()
  }

  const url = new URL(request.url)

  // Handle login form submission (POST to any path — same URL)
  if (request.method === 'POST') {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const u = params.get('u') ?? ''
    const p = params.get('p') ?? ''

    if (u === authUser && p === authPass) {
      // Correct — set cookie and redirect back to the requested page
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.pathname + url.search,
          'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      })
    }

    // Wrong credentials
    return new Response(loginPage(true), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Unauthenticated GET — show login form
  return new Response(loginPage(), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

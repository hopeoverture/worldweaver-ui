import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, { count: number; reset: number }>
}

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  return (req as any).ip ?? '127.0.0.1'
}

function matchBucket(pathname: string, method: string): { key: string; max: number; windowMs: number } | null {
  if (method === 'POST' && /^\/api\/worlds\/[\w-]+\/invites$/.test(pathname)) {
    return { key: 'invites.create', max: 10, windowMs: 60_000 }
  }
  if (method === 'POST' && pathname === '/api/admin/seed-core-templates') {
    return { key: 'admin.seed', max: 2, windowMs: 60_000 }
  }
  return null
}

function rateLimit(req: NextRequest): NextResponse | null {
  if (!globalThis.__rateLimitStore) globalThis.__rateLimitStore = new Map()
  const store = globalThis.__rateLimitStore
  const bucket = matchBucket(req.nextUrl.pathname, req.method)
  if (!bucket) return null
  const ip = getClientIp(req)
  const now = Date.now()
  const key = `${ip}:${bucket.key}`
  const record = store.get(key)
  if (!record || now > record.reset) {
    store.set(key, { count: 1, reset: now + bucket.windowMs })
    return null
  }
  if (record.count >= bucket.max) {
    const res = NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    res.headers.set('Retry-After', Math.ceil((record.reset - now) / 1000).toString())
    return res
  }
  record.count += 1
  store.set(key, record)
  return null
}

function applySecurityHeaders(res: NextResponse): void {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  
  // Enhanced CSP for XSS prevention
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ].join('; ')
  
  res.headers.set('Content-Security-Policy', csp)
}

export async function middleware(request: NextRequest) {
  // Prepare Supabase response wrapper for session handling
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Keep auth call adjacent to client creation to avoid subtle bugs
  await supabase.auth.getUser()

  const isApi = request.nextUrl.pathname.startsWith('/api/')
  if (isApi) {
    const limited = rateLimit(request)
    if (limited) {
      // Propagate any cookies set by Supabase into the limited response
      for (const c of supabaseResponse.cookies.getAll()) {
        // Best-effort copy; omit options to satisfy types
        limited.cookies.set(c.name, c.value)
      }
      applySecurityHeaders(limited)
      return limited
    }
    applySecurityHeaders(supabaseResponse)
  }

  return supabaseResponse
}

export const config = {
  // Apply to API routes and app routes (excluding static assets)
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

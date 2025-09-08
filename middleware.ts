import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiting'

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

async function applyRateLimit(request: NextRequest, response: NextResponse): Promise<NextResponse | null> {
  try {
    const rateLimit = await checkRateLimit(request)
    
    if (rateLimit && !rateLimit.allowed) {
      // Create rate limit exceeded response
      const limitedResponse = NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfter: rateLimit.retryAfter,
              resetTime: rateLimit.resetTime
            }
          }
        },
        { status: 429 }
      )

      // Add rate limit headers
      limitedResponse.headers.set('X-RateLimit-Limit', rateLimit.count.toString())
      limitedResponse.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      limitedResponse.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
      limitedResponse.headers.set('Retry-After', rateLimit.retryAfter.toString())

      // Propagate any cookies set by Supabase into the limited response
      for (const c of response.cookies.getAll()) {
        limitedResponse.cookies.set(c.name, c.value)
      }

      return limitedResponse
    }

    // Add rate limit headers to successful responses
    if (rateLimit) {
      response.headers.set('X-RateLimit-Limit', rateLimit.count.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
    }

    return null // Continue normally
  } catch (error) {
    console.error('Rate limiting error in middleware:', error)
    // Continue without rate limiting on error (fail open)
    return null
  }
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
    // Apply enhanced rate limiting
    const limitedResponse = await applyRateLimit(request, supabaseResponse)
    if (limitedResponse) {
      applySecurityHeaders(limitedResponse)
      return limitedResponse
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

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiting'
import { randomBytes } from 'crypto'

function generateNonce(): string {
  return randomBytes(16).toString('base64')
}

function applySecurityHeaders(res: NextResponse, request?: NextRequest): void {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  
  // Generate nonces for this request
  const scriptNonce = generateNonce()
  const styleNonce = generateNonce()
  
  // Set nonces in headers for Next.js to use
  res.headers.set('x-nonce-script', scriptNonce)
  res.headers.set('x-nonce-style', styleNonce)
  
  // Enhanced CSP without unsafe-inline (production-ready)
  const isDev = process.env.NODE_ENV === 'development'
  const csp = [
    "default-src 'self'",
    // Scripts: strict nonce-based in production, allow unsafe in dev for HMR
    isDev 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' data:"
      : `script-src 'self' 'nonce-${scriptNonce}' 'strict-dynamic'`,
    // Styles: nonce-based with fallback for external stylesheets
    isDev
      ? "style-src 'self' 'unsafe-inline'"
      : `style-src 'self' 'nonce-${styleNonce}' https://fonts.googleapis.com`,
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
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

  // Check if we have valid Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Skip Supabase setup if we don't have valid credentials (e.g., during build)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Middleware: Supabase credentials not available, skipping auth middleware')
    
    // Apply security headers and return early for build/invalid env
    const isApi = request.nextUrl.pathname.startsWith('/api/')
    if (isApi) {
      applySecurityHeaders(supabaseResponse)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
  try {
    await supabase.auth.getUser()
  } catch (error) {
    // Ignore auth errors during build/development
    console.warn('Supabase auth error in middleware:', error)
  }

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

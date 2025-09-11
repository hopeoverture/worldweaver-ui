/**
 * Next.js Middleware
 * Handles authentication and route protection
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from "@/lib/auth/config"

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Simple rate limiting function
 */
function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userLimit.count >= limit) {
    return false
  }

  userLimit.count++
  return true
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimit() {
  const now = Date.now()
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get client IP for rate limiting
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Different limits for different routes
    let limit = 100 // default
    let windowMs = 60000 // 1 minute

    // Stricter limits for auth routes
    if (pathname.startsWith('/api/auth/')) {
      limit = 10
      windowMs = 60000 // 1 minute
    }

    // Very strict limits for sensitive operations
    if (pathname.includes('/delete') || pathname.includes('/create')) {
      limit = 20
      windowMs = 60000 // 1 minute
    }

    if (!rateLimit(ip, limit, windowMs)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }
  }

  // Security headers for all responses
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // Protected API routes that require authentication
  const protectedApiRoutes = [
    '/api/worlds',
    '/api/entities',
    '/api/templates',
    '/api/relationships',
  ]

  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route) && !pathname.includes('/public')
  )

  if (isProtectedApiRoute) {
    try {
      const session = await auth()
      
      if (!session?.user) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }

      // Add user ID to headers for API routes to use
      response.headers.set('x-user-id', session.user.id)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Authentication error' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }

  // Protected pages that require authentication
  const protectedPages = [
    '/dashboard',
    '/worlds',
    '/profile',
    '/settings',
  ]

  const isProtectedPage = protectedPages.some(route => pathname.startsWith(route))

  if (isProtectedPage) {
    try {
      const session = await auth()
      
      if (!session?.user) {
        const signInUrl = new URL('/auth/signin', request.url)
        signInUrl.searchParams.set('callbackUrl', request.url)
        return NextResponse.redirect(signInUrl)
      }
    } catch (error) {
      console.error('Auth middleware error:', error)
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth/') && !pathname.includes('/signout')) {
    try {
      const session = await auth()
      
      if (session?.user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      // Allow access to auth pages if there's an error
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
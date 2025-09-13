/**
 * CSRF Protection Utilities
 * 
 * Provides Cross-Site Request Forgery protection for state-changing operations.
 * Uses the double-submit cookie pattern with signed tokens.
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-secret-change-in-production';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Create a signed CSRF token with HMAC
 */
export function signCSRFToken(token: string): string {
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
}

/**
 * Verify a signed CSRF token
 */
export function verifyCSRFToken(signedToken: string): boolean {
  try {
    const [token, signature] = signedToken.split('.');
    if (!token || !signature) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', CSRF_SECRET);
    hmac.update(token);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Extract CSRF token from request headers or body
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Check X-CSRF-Token header first
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }

  // Check _csrf field in form data (for multipart forms)
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    // This would need to be handled in the actual route handler
    // since we can't parse multipart data here
    return null;
  }

  return null;
}

/**
 * Validate CSRF token for state-changing operations
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return true;
  }

  // Skip CSRF validation for API routes with valid auth tokens
  // (assuming API consumers use proper authentication)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true;
  }

  const token = extractCSRFToken(request);
  if (!token) {
    return false;
  }

  return verifyCSRFToken(token);
}

/**
 * Middleware helper to check CSRF protection
 */
export function requireCSRFProtection(request: NextRequest): boolean {
  // Only apply CSRF protection to form submissions and API mutations
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
  
  if (!isApiRoute || !isStateChanging) {
    return true; // No CSRF protection needed
  }

  return validateCSRFToken(request);
}

/**
 * Generate CSRF token for client-side use
 * Should be called from a secure endpoint and included in forms/headers
 */
export function getCSRFTokenForClient(): { token: string; signedToken: string } {
  const token = generateCSRFToken();
  const signedToken = signCSRFToken(token);
  
  return { token, signedToken };
}

/**
 * Create CSRF protection response headers
 */
export function createCSRFHeaders(): Record<string, string> {
  const { signedToken } = getCSRFTokenForClient();
  
  return {
    'X-CSRF-Token': signedToken,
    'Vary': 'X-CSRF-Token'
  };
}
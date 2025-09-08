/**
 * Security utilities for input sanitization and XSS prevention
 */
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes script tags, javascript: URLs, and other dangerous content
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is, will be sanitized on client
    return dirty;
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['class'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
}

/**
 * Sanitize plain text content, removing any HTML tags
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic HTML tag removal
    return dirty.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Validate and sanitize JSON field structure for entity forms
 */
export function validateJsonField(value: unknown): { isValid: boolean; sanitized: unknown; error?: string } {
  if (value === null || value === undefined) {
    return { isValid: true, sanitized: value };
  }

  if (typeof value === 'string') {
    // Sanitize string values
    const sanitized = sanitizeText(value);
    return { isValid: true, sanitized };
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return { isValid: true, sanitized: value };
  }

  if (Array.isArray(value)) {
    const sanitizedArray = value.map(item => {
      const result = validateJsonField(item);
      return result.sanitized;
    });
    return { isValid: true, sanitized: sanitizedArray };
  }

  if (typeof value === 'object') {
    const sanitizedObject: Record<string, unknown> = {};
    
    for (const [key, val] of Object.entries(value)) {
      // Sanitize object keys
      const sanitizedKey = sanitizeText(key);
      
      // Validate key format (no script injection)
      if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedKey)) {
        return { 
          isValid: false, 
          sanitized: null, 
          error: `Invalid field key: ${key}` 
        };
      }

      const result = validateJsonField(val);
      if (!result.isValid) {
        return result;
      }
      
      sanitizedObject[sanitizedKey] = result.sanitized;
    }

    return { isValid: true, sanitized: sanitizedObject };
  }

  return { 
    isValid: false, 
    sanitized: null, 
    error: `Unsupported data type: ${typeof value}` 
  };
}

/**
 * Sanitize URLs to prevent javascript: and data: URL attacks
 */
export function sanitizeUrl(url: string): string {
  const sanitized = url.trim().toLowerCase();
  
  if (sanitized.startsWith('javascript:') || 
      sanitized.startsWith('data:') || 
      sanitized.startsWith('vbscript:')) {
    return '';
  }

  return url.trim();
}

/**
 * Validate and sanitize template field values
 */
export function sanitizeTemplateField(fieldType: string, value: unknown): unknown {
  switch (fieldType) {
    case 'shortText':
      return typeof value === 'string' ? sanitizeText(value) : '';
    
    case 'longText':
      return typeof value === 'string' ? sanitizeText(value) : '';
    
    case 'richText':
      return typeof value === 'string' ? sanitizeHtml(value) : '';
    
    case 'number':
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    
    case 'select':
      return typeof value === 'string' ? sanitizeText(value) : '';
    
    case 'multiSelect':
      if (Array.isArray(value)) {
        return value.map(v => sanitizeText(String(v)));
      }
      return [];
    
    case 'image':
      return typeof value === 'string' ? sanitizeUrl(value) : '';
    
    case 'reference':
      return typeof value === 'string' ? sanitizeText(value) : '';
    
    default:
      return typeof value === 'string' ? sanitizeText(value) : value;
  }
}

/**
 * Security headers configuration for middleware
 */
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

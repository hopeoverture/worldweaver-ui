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
    // Server-side: Use regex-based sanitization for security
    return sanitizeHtmlServer(dirty);
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
 * Server-side HTML sanitization using regex patterns
 * More basic than DOMPurify but provides essential XSS protection
 */
function sanitizeHtmlServer(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let clean = dirty.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'object', 'embed', 'form', 'input', 'iframe', 'link', 'style'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gis');
    clean = clean.replace(regex, '');
    // Also remove self-closing versions
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    clean = clean.replace(selfClosingRegex, '');
  });
  
  // Remove javascript: and data: URLs
  clean = clean.replace(/(?:href|src)\s*=\s*["'](?:javascript|data|vbscript):[^"']*["']/gi, '');
  
  // Remove event handlers
  const eventHandlers = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 
    'onkeyup', 'onkeypress', 'onresize', 'onscroll'
  ];
  eventHandlers.forEach(handler => {
    const regex = new RegExp(`\\s+${handler}\\s*=\\s*["'][^"']*["']`, 'gi');
    clean = clean.replace(regex, '');
  });
  
  // Allow only safe tags and attributes
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
  
  clean = clean.replace(tagPattern, (match, tagName) => {
    const tag = tagName.toLowerCase();
    if (allowedTags.includes(tag)) {
      // For allowed tags, keep only class attributes
      return match.replace(/\s+(?!class\s*=)[a-zA-Z-]+\s*=\s*["'][^"']*["']/gi, '');
    }
    return ''; // Remove disallowed tags
  });
  
  return clean.trim();
}

/**
 * Sanitize plain text content, removing any HTML tags
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: comprehensive HTML tag and entity removal
    return sanitizeTextServer(dirty);
  }

  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Server-side text sanitization - removes all HTML and dangerous content
 */
function sanitizeTextServer(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  let clean = dirty;
  
  // Remove all HTML tags
  clean = clean.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  Object.entries(entities).forEach(([entity, char]) => {
    clean = clean.replace(new RegExp(entity, 'g'), char);
  });
  
  // Remove any remaining HTML entities
  clean = clean.replace(/&[#\w]+;/g, '');
  
  // Remove dangerous protocols
  clean = clean.replace(/(?:javascript|data|vbscript):/gi, '');
  
  return clean.trim();
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
 * NOTE: CSP is now generated dynamically with nonces in middleware.ts
 */
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    // NOTE: This static config is kept for compatibility but middleware.ts generates dynamic nonce-based CSP
    "script-src 'self' 'strict-dynamic'",
    "style-src 'self' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

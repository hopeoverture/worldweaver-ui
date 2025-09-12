/**
 * Security test utilities for validating XSS prevention
 * Run these tests to ensure sanitization is working correctly
 */

// Common XSS attack vectors to test against
export const XSS_TEST_VECTORS = [
  // Script injection
  '<script>alert("xss")</script>',
  '<script src="http://evil.com/xss.js"></script>',
  
  // Event handler injection
  '<img src="x" onerror="alert(\'xss\')">',
  '<div onclick="alert(\'xss\')">Click me</div>',
  '<body onload="alert(\'xss\')">',
  
  // JavaScript URLs
  'javascript:alert("xss")',
  'javascript:void(0);alert("xss")',
  
  // Data URLs
  'data:text/html,<script>alert("xss")</script>',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgieHNzIik8L3NjcmlwdD4=',
  
  // CSS injection
  '<style>body{background:url("javascript:alert(\'xss\')")}</style>',
  '<link rel="stylesheet" href="javascript:alert(\'xss\')">',
  
  // HTML5 vectors
  '<svg onload="alert(\'xss\')">',
  '<iframe src="javascript:alert(\'xss\')"></iframe>',
  '<object data="javascript:alert(\'xss\')"></object>',
  '<embed src="javascript:alert(\'xss\')">',
  
  // Template injection
  '{{constructor.constructor("alert(\'xss\')")()}}',
  '${alert("xss")}',
  
  // Unicode and encoding bypasses
  '<script>alert(String.fromCharCode(88,83,83))</script>',
  '&#60;script&#62;alert(&#39;xss&#39;)&#60;/script&#62;',
  
  // Mixed case evasion
  '<ScRiPt>alert("xss")</ScRiPt>',
  '<IMG SRC="javascript:alert(\'xss\')">',
];

/**
 * Test sanitization functions against XSS vectors
 */
export function runXSSTests(): { passed: number; failed: number; results: Array<{ vector: string; sanitized: string; safe: boolean; error?: string }> } {
  // This function should only run in a test environment or development
  if (typeof window === 'undefined') {
    console.warn('XSS tests should be run in a browser environment');
    return { passed: 0, failed: 0, results: [] };
  }

  const results: Array<{ vector: string; sanitized: string; safe: boolean; error?: string }> = [];
  let passed = 0;
  let failed = 0;

  // Import sanitization functions dynamically to avoid import issues
  import('@/lib/security').then(({ sanitizeHtml, sanitizeText, sanitizeUrl }) => {
    XSS_TEST_VECTORS.forEach(vector => {
      try {
        // Test HTML sanitization
        const sanitizedHtml = sanitizeHtml(vector);
        const sanitizedText = sanitizeText(vector);
        const sanitizedUrl = sanitizeUrl(vector);

        // Check if dangerous content is removed
        const htmlSafe = !sanitizedHtml.includes('<script') && 
                        !sanitizedHtml.includes('javascript:') && 
                        !sanitizedHtml.includes('onerror=') &&
                        !sanitizedHtml.includes('onload=') &&
                        !sanitizedHtml.includes('onclick=');

        const textSafe = !sanitizedText.includes('<script') && 
                        !sanitizedText.includes('<');

        const urlSafe = !sanitizedUrl.includes('javascript:') && 
                       !sanitizedUrl.includes('data:text/html');

        const overallSafe = htmlSafe && textSafe && urlSafe;

        if (overallSafe) {
          passed++;
        } else {
          failed++;
        }

        results.push({
          vector,
          sanitized: JSON.stringify({
            html: sanitizedHtml,
            text: sanitizedText,
            url: sanitizedUrl
          }),
          safe: overallSafe
        });

      } catch (error) {
        failed++;
        results.push({
          vector,
          sanitized: '',
          safe: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    console.log(`XSS Test Results: ${passed} passed, ${failed} failed`);
    results.forEach(result => {
      if (!result.safe) {
        console.warn(`UNSAFE: ${result.vector} -> ${result.sanitized}`);
      }
    });
  });

  return { passed, failed, results };
}

/**
 * Manual test function for checking specific content
 */
export function testContent(content: string): { safe: boolean; sanitized: { html: string; text: string; url: string } } {
  if (typeof window === 'undefined') {
    return { 
      safe: false, 
      sanitized: { html: content, text: content, url: content } 
    };
  }

  try {
    // Dynamic import to avoid SSR issues
    import('@/lib/security').then(({ sanitizeHtml, sanitizeText, sanitizeUrl }) => {
      const sanitized = {
        html: sanitizeHtml(content),
        text: sanitizeText(content),
        url: sanitizeUrl(content)
      };

      const safe = !sanitized.html.includes('<script') && 
                  !sanitized.html.includes('javascript:') && 
                  !sanitized.html.includes('onerror=') &&
                  !sanitized.text.includes('<script');

      console.log('Content test result:', { content, sanitized, safe });
      return { safe, sanitized };
    });
  } catch (error) {
    console.error('Error testing content:', error);
  }

  return { 
    safe: false, 
    sanitized: { html: '', text: '', url: '' } 
  };
}

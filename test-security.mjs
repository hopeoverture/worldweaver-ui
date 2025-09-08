/**
 * Security validation test script
 * Run this to test XSS prevention and security measures
 */

// Test in Node.js environment
async function testSecurity() {
  console.log('🔒 Running security validation tests...\n');

  // Test 1: Environment validation
  console.log('1. Testing environment validation...');
  try {
    const { validateEnvironment } = await import('./src/lib/env.js');
    const result = validateEnvironment();
    console.log(`   Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
    if (result.errors.length > 0) {
      console.log('   Errors:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.log('   Warnings:', result.warnings);
    }
  } catch (error) {
    console.log(`   ❌ Environment validation failed: ${error.message}`);
  }

  // Test 2: Common XSS vectors (server-side safe)
  console.log('\n2. Testing XSS vector sanitization...');
  const xssVectors = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(\'xss\')">',
    'javascript:alert("xss")',
    '<svg onload="alert(\'xss\')">',
    '{{constructor.constructor("alert(\'xss\')")()}}'
  ];

  // Since we're in Node.js, test the URL sanitization which works server-side
  const { sanitizeUrl } = await import('./src/lib/security.js');
  
  xssVectors.forEach((vector, index) => {
    try {
      const sanitized = sanitizeUrl(vector);
      const isSafe = !sanitized.includes('javascript:') && !sanitized.includes('data:text/html');
      console.log(`   Vector ${index + 1}: ${isSafe ? '✅' : '❌'} ${vector.substring(0, 30)}...`);
    } catch (error) {
      console.log(`   Vector ${index + 1}: ❌ Error - ${error.message}`);
    }
  });

  // Test 3: Template field sanitization
  console.log('\n3. Testing template field sanitization...');
  const { sanitizeTemplateField } = await import('./src/lib/security.js');
  
  const fieldTests = [
    { type: 'shortText', value: '<script>alert("xss")</script>', expected: 'clean' },
    { type: 'number', value: '123<script>', expected: 123 },
    { type: 'multiSelect', value: ['<script>test</script>', 'clean'], expected: 'array' }
  ];

  fieldTests.forEach((test, index) => {
    try {
      const result = sanitizeTemplateField(test.type, test.value);
      const isSafe = !String(result).includes('<script');
      console.log(`   Field ${index + 1} (${test.type}): ${isSafe ? '✅' : '❌'} Sanitized`);
    } catch (error) {
      console.log(`   Field ${index + 1}: ❌ Error - ${error.message}`);
    }
  });

  // Test 4: Security headers validation
  console.log('\n4. Testing security headers...');
  const { securityHeaders } = await import('./src/lib/security.js');
  
  const requiredHeaders = ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options'];
  requiredHeaders.forEach(header => {
    const hasHeader = securityHeaders[header];
    console.log(`   ${header}: ${hasHeader ? '✅' : '❌'} ${hasHeader ? 'Present' : 'Missing'}`);
  });

  console.log('\n🔒 Security validation completed!');
  console.log('\nTo test XSS prevention in browser:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Open browser console');
  console.log('3. Run: import("/lib/security-test.js").then(m => m.runXSSTests())');
}

// Run tests
testSecurity().catch(console.error);

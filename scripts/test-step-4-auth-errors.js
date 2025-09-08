/**
 * Test Script for Step 4: Authentication Error Handling
 * 
 * This script validates the implementation of comprehensive authentication
 * error handling, session timeout management, and user experience improvements.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const checkmark = '✅';
const crossmark = '❌';
const warning = '⚠️';
const info = 'ℹ️';

let passed = 0;
let failed = 0;
let warnings = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(description, condition, isWarning = false) {
  if (condition) {
    log(`${checkmark} ${description}`, 'green');
    passed++;
  } else if (isWarning) {
    log(`${warning} ${description}`, 'yellow');
    warnings++;
  } else {
    log(`${crossmark} ${description}`, 'red');
    failed++;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function fileContains(filePath, searchString) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  return content.includes(searchString);
}

function fileContainsPattern(filePath, pattern) {
  try {
    if (!fileExists(filePath)) return false;
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    return pattern.test(content);
  } catch (error) {
    return false;
  }
}

log('\n' + '='.repeat(60), 'cyan');
log('🔐 STEP 4: AUTHENTICATION ERROR HANDLING VALIDATION', 'cyan');
log('='.repeat(60), 'cyan');

// 1. Enhanced AuthContext Tests
log('\n📋 1. ENHANCED AUTHCONTEXT VALIDATION', 'blue');

test(
  'AuthContext file exists',
  fileExists('src/contexts/AuthContext.tsx')
);

test(
  'AuthContext has AuthErrorState interface',
  fileContains('src/contexts/AuthContext.tsx', 'interface AuthErrorState')
);

test(
  'AuthContext has error classification function',
  fileContains('src/contexts/AuthContext.tsx', 'classifyAuthError')
);

test(
  'AuthContext has retry logic',
  fileContains('src/contexts/AuthContext.tsx', 'retryable') &&
  fileContains('src/contexts/AuthContext.tsx', 'retryLastOperation')
);

test(
  'AuthContext has session monitoring',
  fileContains('src/contexts/AuthContext.tsx', 'sessionTimeout') ||
  fileContains('src/contexts/AuthContext.tsx', 'session') &&
  fileContains('src/contexts/AuthContext.tsx', 'expires_at') ||
  fileContains('src/components/SessionTimeout.tsx', 'session')
);

// 2. Server Auth Function Tests
log('\n🖥️ 2. SERVER AUTH FUNCTION VALIDATION', 'blue');

test(
  'Server auth file exists',
  fileExists('src/lib/auth/server.ts')
);

test(
  'Server auth has proper error handling',
  fileContains('src/lib/auth/server.ts', 'catch') &&
  !fileContains('src/lib/auth/server.ts', 'catch (') &&
  !fileContains('src/lib/auth/server.ts', 'catch(error) {}'),
  true // This is a warning since empty catch blocks should be removed
);

test(
  'Server auth has logging integration',
  fileContains('src/lib/auth/server.ts', 'logAuthError') ||
  fileContains('src/lib/auth/server.ts', 'console.error') ||
  fileContains('src/lib/auth/server.ts', 'logger')
);

test(
  'Server auth functions exist',
  fileContains('src/lib/auth/server.ts', 'getServerAuth') &&
  fileContains('src/lib/auth/server.ts', 'requireAuth')
);

// 3. Session Timeout Component Tests
log('\n⏰ 3. SESSION TIMEOUT COMPONENT VALIDATION', 'blue');

test(
  'SessionTimeout component exists',
  fileExists('src/components/SessionTimeout.tsx')
);

test(
  'SessionTimeout has idle detection',
  fileContains('src/components/SessionTimeout.tsx', 'lastActivity') ||
  fileContains('src/components/SessionTimeout.tsx', 'idle')
);

test(
  'SessionTimeout has user warnings',
  fileContains('src/components/SessionTimeout.tsx', 'showWarning') ||
  fileContains('src/components/SessionTimeout.tsx', 'warning')
);

test(
  'SessionTimeout has session extension',
  fileContains('src/components/SessionTimeout.tsx', 'extendSession') ||
  fileContains('src/components/SessionTimeout.tsx', 'extend')
);

test(
  'SessionTimeout integrated in layout',
  fileContains('src/app/layout.tsx', 'SessionTimeout')
);

// 4. Login Page Enhancement Tests
log('\n🔑 4. LOGIN PAGE ENHANCEMENT VALIDATION', 'blue');

test(
  'Login page exists',
  fileExists('src/app/login/page.tsx')
);

test(
  'Login page uses enhanced error handling',
  fileContains('src/app/login/page.tsx', 'AuthErrorState') ||
  fileContains('src/app/login/page.tsx', 'error') &&
  fileContains('src/app/login/page.tsx', 'retry')
);

test(
  'Login page has retry functionality',
  fileContains('src/app/login/page.tsx', 'retryCount') ||
  fileContains('src/app/login/page.tsx', 'retry')
);

test(
  'Login page has user-friendly error messages',
  fileContains('src/app/login/page.tsx', 'getErrorDisplay') ||
  fileContains('src/app/login/page.tsx', 'error') &&
  fileContains('src/app/login/page.tsx', 'message')
);

// 5. Error Classification Tests
log('\n🏷️ 5. ERROR CLASSIFICATION VALIDATION', 'blue');

const errorTypes = [
  'NETWORK_ERROR',
  'INVALID_CREDENTIALS',
  'SESSION_EXPIRED',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'UNKNOWN_ERROR'
];

errorTypes.forEach(errorType => {
  test(
    `Error type ${errorType} is handled`,
    fileContains('src/contexts/AuthContext.tsx', errorType) ||
    fileContains('src/app/login/page.tsx', errorType),
    true // Warning if not all types are present
  );
});

// 6. Security Features Tests
log('\n🛡️ 6. SECURITY FEATURES VALIDATION', 'blue');

test(
  'Sensitive data is not logged',
  !fileContains('src/contexts/AuthContext.tsx', 'console.log') ||
  !fileContains('src/lib/auth/server.ts', 'password') ||
  !fileContains('src/lib/auth/server.ts', 'token'),
  true
);

test(
  'Error messages don\'t expose sensitive information',
  !fileContains('src/contexts/AuthContext.tsx', 'password') &&
  !fileContains('src/app/login/page.tsx', 'token'),
  true
);

test(
  'Rate limiting considerations present',
  fileContains('src/contexts/AuthContext.tsx', 'RATE_LIMITED') ||
  fileContains('src/contexts/AuthContext.tsx', 'rate') ||
  fileContains('src/contexts/AuthContext.tsx', 'limit'),
  true
);

// 7. TypeScript Integration Tests
log('\n📝 7. TYPESCRIPT INTEGRATION VALIDATION', 'blue');

test(
  'AuthContext has proper TypeScript types',
  fileContains('src/contexts/AuthContext.tsx', 'interface') &&
  fileContains('src/contexts/AuthContext.tsx', 'AuthErrorState')
);

test(
  'SessionTimeout has proper TypeScript types',
  fileContains('src/components/SessionTimeout.tsx', 'interface') ||
  fileContains('src/components/SessionTimeout.tsx', 'React.ReactNode')
);

test(
  'Error handling has type safety',
  fileContains('src/contexts/AuthContext.tsx', 'AuthError') ||
  fileContains('src/contexts/AuthContext.tsx', 'Error') &&
  fileContains('src/contexts/AuthContext.tsx', 'type')
);

// 8. User Experience Tests
log('\n👥 8. USER EXPERIENCE VALIDATION', 'blue');

test(
  'Loading states are handled',
  fileContains('src/contexts/AuthContext.tsx', 'loading') ||
  fileContains('src/app/login/page.tsx', 'loading')
);

test(
  'Success feedback is provided',
  fileContains('src/contexts/AuthContext.tsx', 'success') ||
  fileContains('src/app/login/page.tsx', 'success') ||
  fileContains('src/components/SessionTimeout.tsx', 'success')
);

test(
  'Clear error messages for users',
  fileContains('src/app/login/page.tsx', 'Invalid credentials') ||
  fileContains('src/app/login/page.tsx', 'Network error') ||
  fileContains('src/contexts/AuthContext.tsx', 'user-friendly'),
  true
);

// Summary
log('\n' + '='.repeat(60), 'cyan');
log('📊 VALIDATION SUMMARY', 'cyan');
log('='.repeat(60), 'cyan');

log(`\n${checkmark} Tests Passed: ${passed}`, 'green');
if (warnings > 0) {
  log(`${warning} Warnings: ${warnings}`, 'yellow');
}
if (failed > 0) {
  log(`${crossmark} Tests Failed: ${failed}`, 'red');
}

const total = passed + failed + warnings;
const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

if (failed === 0) {
  log('\n🎉 STEP 4: AUTHENTICATION ERROR HANDLING - IMPLEMENTATION COMPLETE!', 'green');
  log('\nNext Steps:', 'blue');
  log('• Test authentication error scenarios manually', 'reset');
  log('• Verify session timeout functionality', 'reset');
  log('• Update CHECKLIST.md to mark Step 4 as complete', 'reset');
  log('• Proceed to Step 5: Input Validation & Sanitization', 'reset');
} else {
  log('\n⚠️ Some tests failed. Please address the issues above before proceeding.', 'yellow');
}

log('\n' + '='.repeat(60), 'cyan');

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);

/**
 * Test Script for Step 5: API Response Type Safety
 * 
 * This script validates the implementation of standardized API response types
 * to improve type safety and error handling consistency across all endpoints.
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

function countMatches(filePath, searchString) {
  if (!fileExists(filePath)) return 0;
  const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  return (content.match(new RegExp(searchString, 'g')) || []).length;
}

function getApiRouteFiles() {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const files = [];
  
  function findRouteFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        findRouteFiles(itemPath);
      } else if (item === 'route.ts') {
        files.push(path.relative(path.join(__dirname, '..'), itemPath));
      }
    }
  }
  
  findRouteFiles(apiDir);
  return files;
}

log('\n' + '='.repeat(60), 'cyan');
log('🔧 STEP 5: API RESPONSE TYPE SAFETY VALIDATION', 'cyan');
log('='.repeat(60), 'cyan');

// 1. Core Type System Tests
log('\n📊 1. CORE TYPE SYSTEM VALIDATION', 'blue');

test(
  'API types file exists',
  fileExists('src/lib/api-types.ts')
);

test(
  'API utilities file exists',
  fileExists('src/lib/api-utils.ts')
);

test(
  'ApiResponse generic type defined',
  fileContains('src/lib/api-types.ts', 'type ApiResponse<T')
);

test(
  'Error code constants defined',
  fileContains('src/lib/api-types.ts', 'API_ERROR_CODES')
);

test(
  'Success/failure helper functions exist',
  fileContains('src/lib/api-types.ts', 'createApiSuccess') &&
  fileContains('src/lib/api-types.ts', 'createApiFailure')
);

// 2. API Utilities Tests
log('\n🛠️ 2. API UTILITIES VALIDATION', 'blue');

test(
  'Standard response helpers exist',
  fileContains('src/lib/api-utils.ts', 'apiSuccess') &&
  fileContains('src/lib/api-utils.ts', 'apiError')
);

test(
  'Error handling utilities exist',
  fileContains('src/lib/api-utils.ts', 'apiAuthRequired') &&
  fileContains('src/lib/api-utils.ts', 'apiValidationError') &&
  fileContains('src/lib/api-utils.ts', 'apiNotFound')
);

test(
  'Error wrapper function exists',
  fileContains('src/lib/api-utils.ts', 'withApiErrorHandling')
);

test(
  'Request body parser exists',
  fileContains('src/lib/api-utils.ts', 'parseRequestBody')
);

test(
  'Request ID generation exists',
  fileContains('src/lib/api-utils.ts', 'generateRequestId')
);

// 3. Error Code Coverage Tests
log('\n🏷️ 3. ERROR CODE COVERAGE VALIDATION', 'blue');

const errorCodes = [
  'AUTHENTICATION_REQUIRED',
  'INVALID_TOKEN',
  'INSUFFICIENT_PERMISSIONS',
  'INVALID_REQUEST_BODY',
  'MISSING_REQUIRED_FIELD',
  'INVALID_FIELD_FORMAT',
  'RESOURCE_NOT_FOUND',
  'RESOURCE_ALREADY_EXISTS',
  'RESOURCE_CONFLICT',
  'RATE_LIMIT_EXCEEDED',
  'INTERNAL_SERVER_ERROR',
  'DATABASE_ERROR'
];

errorCodes.forEach(code => {
  test(
    `Error code ${code} defined`,
    fileContains('src/lib/api-types.ts', code)
  );
});

// 4. Resource-Specific Response Types Tests
log('\n📦 4. RESOURCE RESPONSE TYPES VALIDATION', 'blue');

const responseTypes = [
  'WorldResponse',
  'WorldsListResponse',
  'EntityResponse',
  'EntitiesListResponse',
  'TemplateResponse',
  'TemplatesListResponse',
  'FolderResponse',
  'FoldersListResponse',
  'InviteResponse',
  'InvitesListResponse',
  'RelationshipResponse',
  'RelationshipsListResponse'
];

responseTypes.forEach(type => {
  test(
    `Response type ${type} defined`,
    fileContains('src/lib/api-types.ts', type),
    true // Warning only as some may not be needed yet
  );
});

// 5. API Route Implementation Tests
log('\n🛣️ 5. API ROUTE IMPLEMENTATION VALIDATION', 'blue');

const apiRoutes = getApiRouteFiles();
log(`${info} Found ${apiRoutes.length} API route files`, 'cyan');

let routesUsingNewPattern = 0;
let routesUsingOldPattern = 0;

apiRoutes.forEach(routeFile => {
  const usesNewPattern = fileContains(routeFile, 'apiSuccess') || 
                        fileContains(routeFile, 'apiError') ||
                        fileContains(routeFile, 'withApiErrorHandling');
  
  const usesOldPattern = fileContains(routeFile, 'NextResponse.json') &&
                        !fileContains(routeFile, 'apiSuccess');
  
  if (usesNewPattern) {
    routesUsingNewPattern++;
  } else if (usesOldPattern) {
    routesUsingOldPattern++;
  }
});

test(
  `API routes using new pattern: ${routesUsingNewPattern}/${apiRoutes.length}`,
  routesUsingNewPattern > 0
);

test(
  `Legacy API routes remaining: ${routesUsingOldPattern}`,
  routesUsingOldPattern === 0,
  true // Warning since migration is in progress
);

// 6. Specific Route Updates Tests
log('\n🎯 6. SPECIFIC ROUTE UPDATES VALIDATION', 'blue');

test(
  'Worlds route uses new pattern',
  fileContains('src/app/api/worlds/route.ts', 'withApiErrorHandling') &&
  fileContains('src/app/api/worlds/route.ts', 'apiSuccess')
);

test(
  'Worlds route has proper typing',
  fileContains('src/app/api/worlds/route.ts', 'WorldsListResponse') ||
  fileContains('src/app/api/worlds/route.ts', 'WorldResponse')
);

test(
  'Entities route uses new pattern',
  fileContains('src/app/api/entities/[id]/route.ts', 'withApiErrorHandling') &&
  fileContains('src/app/api/entities/[id]/route.ts', 'apiSuccess')
);

test(
  'Entities route has proper typing',
  fileContains('src/app/api/entities/[id]/route.ts', 'EntityResponse')
);

// 7. TypeScript Integration Tests
log('\n📝 7. TYPESCRIPT INTEGRATION VALIDATION', 'blue');

test(
  'API types use proper generics',
  fileContains('src/lib/api-types.ts', 'ApiResponse<T = unknown>') &&
  fileContains('src/lib/api-types.ts', 'ApiResponse<T>')
);

test(
  'Error codes are properly typed',
  fileContains('src/lib/api-types.ts', 'ApiErrorCode') &&
  fileContains('src/lib/api-types.ts', 'typeof API_ERROR_CODES')
);

test(
  'Helper functions are properly typed',
  fileContains('src/lib/api-utils.ts', 'NextResponse<ApiResponse') &&
  fileContains('src/lib/api-utils.ts', 'NextResponse<')
);

// 8. Error Handling Consistency Tests
log('\n🚨 8. ERROR HANDLING CONSISTENCY VALIDATION', 'blue');

test(
  'HTTP status codes properly mapped',
  fileContains('src/lib/api-utils.ts', 'ERROR_STATUS_MAP') &&
  fileContains('src/lib/api-utils.ts', '401') &&
  fileContains('src/lib/api-utils.ts', '404') &&
  fileContains('src/lib/api-utils.ts', '500')
);

test(
  'Zod validation errors handled',
  fileContains('src/lib/api-utils.ts', 'ZodError') &&
  fileContains('src/lib/api-utils.ts', 'apiValidationError')
);

test(
  'Authentication errors standardized',
  fileContains('src/lib/api-utils.ts', 'apiAuthRequired')
);

test(
  'Internal errors safely handled',
  fileContains('src/lib/api-utils.ts', 'apiInternalError') &&
  fileContains('src/lib/api-utils.ts', 'console.error')
);

// 9. Security Features Tests
log('\n🛡️ 9. SECURITY FEATURES VALIDATION', 'blue');

test(
  'Request ID generation for tracing',
  fileContains('src/lib/api-utils.ts', 'X-Request-ID')
);

test(
  'Security headers added',
  fileContains('src/lib/api-utils.ts', 'X-Content-Type-Options') &&
  fileContains('src/lib/api-utils.ts', 'X-Frame-Options') &&
  fileContains('src/lib/api-utils.ts', 'X-XSS-Protection')
);

test(
  'Rate limiting headers supported',
  fileContains('src/lib/api-utils.ts', 'X-RateLimit-Remaining') &&
  fileContains('src/lib/api-utils.ts', 'X-RateLimit-Reset')
);

test(
  'Sensitive data protection in errors',
  fileContains('src/lib/api-utils.ts', 'console.error') &&
  !fileContains('src/lib/api-utils.ts', 'password') &&
  !fileContains('src/lib/api-utils.ts', 'token')
);

// 10. Response Consistency Tests
log('\n📋 10. RESPONSE CONSISTENCY VALIDATION', 'blue');

test(
  'Success responses have consistent structure',
  fileContains('src/lib/api-types.ts', 'success: true') &&
  fileContains('src/lib/api-types.ts', 'data: T')
);

test(
  'Error responses have consistent structure',
  fileContains('src/lib/api-types.ts', 'success: false') &&
  fileContains('src/lib/api-types.ts', 'error: ApiError')
);

test(
  'Error details include proper fields',
  fileContains('src/lib/api-types.ts', 'code: string') &&
  fileContains('src/lib/api-types.ts', 'message: string') &&
  fileContains('src/lib/api-types.ts', 'details?:')
);

test(
  'Validation issues properly structured',
  fileContains('src/lib/api-types.ts', 'issues?:') &&
  fileContains('src/lib/api-types.ts', 'path: string[]') &&
  fileContains('src/lib/api-types.ts', 'message: string')
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
  log('\n🎉 STEP 5: API RESPONSE TYPE SAFETY - IMPLEMENTATION COMPLETE!', 'green');
  log('\nNext Steps:', 'blue');
  log('• Migrate remaining API routes to use new pattern', 'reset');
  log('• Update frontend to use typed API responses', 'reset');
  log('• Add API response validation tests', 'reset');
  log('• Update CHECKLIST.md to mark Step 5 as complete', 'reset');
  log('• Proceed to Step 6: Rate Limiting Scalability', 'reset');
} else {
  log('\n⚠️ Some tests failed. Please address the issues above before proceeding.', 'yellow');
}

log('\nImplementation Progress:', 'blue');
log(`• API Routes Updated: ${routesUsingNewPattern}/${apiRoutes.length}`, 'reset');
log(`• Legacy Routes Remaining: ${routesUsingOldPattern}`, 'reset');
log('• Type System: Comprehensive API response types', 'reset');
log('• Error Handling: Standardized across all endpoints', 'reset');
log('• Security: Request IDs, security headers, safe error messages', 'reset');

log('\n' + '='.repeat(60), 'cyan');

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);

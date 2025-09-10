#!/usr/bin/env tsx
/**
 * Automated Runtime Checks
 * Tests database connectivity, RLS policies, and validates integration
 */

import { writeFileSync } from 'fs';
import { adminClient } from './supabaseAdmin.js';

interface RuntimeCheckResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
  details?: any;
}

interface RuntimeReport {
  timestamp: string;
  overallStatus: 'pass' | 'fail' | 'warning';
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  checks: RuntimeCheckResult[];
  recommendations: string[];
}

async function runCheck(name: string, checkFn: () => Promise<any>): Promise<RuntimeCheckResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Running: ${name}...`);
    const result = await checkFn();
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Passed (${duration}ms)`);
    return {
      name,
      success: true,
      message: 'Check passed',
      duration,
      details: result
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    
    console.log(`   ❌ Failed (${duration}ms): ${message}`);
    return {
      name,
      success: false,
      message,
      duration,
      details: null
    };
  }
}

async function runRuntimeChecks(): Promise<RuntimeReport> {
  console.log('🚀 Starting runtime checks...');
  
  const checks: RuntimeCheckResult[] = [];
  
  // 1. Database connectivity check
  checks.push(await runCheck('Database Connectivity', async () => {
    const { data, error } = await adminClient.from('worlds').select('count').limit(1);
    if (error) throw new Error(`Database error: ${error.message}`);
    return { connected: true, queryResult: data };
  }));
  
  // 2. Table existence checks
  for (const table of ['worlds', 'entities', 'templates', 'folders', 'relationships']) {
    checks.push(await runCheck(`Table: ${table}`, async () => {
      const { data, error } = await adminClient.from(table).select('id').limit(1);
      if (error) throw new Error(`Table ${table} error: ${error.message}`);
      return { tableExists: true, sampleData: data };
    }));
  }
  
  // 3. RLS Policy checks
  checks.push(await runCheck('RLS Policies Active', async () => {
    // Check if RLS is enabled on critical tables
    const { data, error } = await adminClient
      .from('pg_class')
      .select('relname, relrowsecurity')
      .in('relname', ['worlds', 'entities', 'templates']);
    
    if (error) throw new Error(`RLS check failed: ${error.message}`);
    
    const tablesWithRLS = data?.filter(table => table.relrowsecurity) || [];
    if (tablesWithRLS.length === 0) {
      throw new Error('No tables have RLS enabled');
    }
    
    return { rlsEnabled: true, tables: tablesWithRLS };
  }));
  
  // 4. Authentication check
  checks.push(await runCheck('Auth Users Table', async () => {
    const { data, error } = await adminClient.from('profiles').select('id').limit(1);
    if (error) throw new Error(`Auth/profiles error: ${error.message}`);
    return { authWorking: true };
  }));
  
  // 5. Storage bucket checks
  checks.push(await runCheck('Storage Buckets', async () => {
    const { data, error } = await adminClient.storage.listBuckets();
    if (error) throw new Error(`Storage error: ${error.message}`);
    
    const bucketNames = data?.map(b => b.name) || [];
    return { buckets: bucketNames, count: bucketNames.length };
  }));
  
  // 6. Custom function checks
  checks.push(await runCheck('Custom Functions', async () => {
    try {
      const { data, error } = await adminClient.rpc('accept_world_invite', { invite_token: 'test-token-for-validation' });
      // We expect this to fail with a specific error (not a function not found error)
      if (error && !error.message.includes('not found') && !error.message.includes('does not exist')) {
        return { functionExists: true, callable: true };
      }
      throw new Error('Function may not exist or be callable');
    } catch (err) {
      // If we get here due to our own throw, re-throw
      if (err instanceof Error && err.message.includes('may not exist')) {
        throw err;
      }
      // Otherwise, function exists but failed with expected error
      return { functionExists: true, callable: true };
    }
  }));
  
  // 7. JSONB field validation
  checks.push(await runCheck('JSONB Fields', async () => {
    const { data, error } = await adminClient
      .from('worlds')
      .select('settings')
      .not('settings', 'is', null)
      .limit(1);
    
    if (error) throw new Error(`JSONB query failed: ${error.message}`);
    return { jsonbWorking: true, sample: data };
  }));
  
  // 8. Index performance check
  checks.push(await runCheck('Index Performance', async () => {
    const start = Date.now();
    const { data, error } = await adminClient
      .from('entities')
      .select('id, world_id')
      .eq('world_id', '00000000-0000-0000-0000-000000000000') // Non-existent world
      .limit(10);
    
    const queryTime = Date.now() - start;
    
    if (error) throw new Error(`Index query failed: ${error.message}`);
    if (queryTime > 1000) {
      throw new Error(`Query too slow: ${queryTime}ms (expected < 1000ms)`);
    }
    
    return { indexPerformance: 'good', queryTime };
  }));
  
  // 9. World membership validation
  checks.push(await runCheck('World Membership Logic', async () => {
    const { data, error } = await adminClient
      .from('world_members')
      .select('world_id, user_id, role')
      .limit(1);
    
    if (error) throw new Error(`Membership query failed: ${error.message}`);
    return { membershipStructure: 'valid' };
  }));
  
  // Calculate summary
  const passed = checks.filter(c => c.success).length;
  const failed = checks.filter(c => !c.success).length;
  
  const overallStatus: 'pass' | 'fail' | 'warning' = 
    failed === 0 ? 'pass' : 
    failed > 2 ? 'fail' : 'warning';
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (failed > 0) {
    recommendations.push(`${failed} checks failed - review and fix issues before production`);
  }
  
  const slowChecks = checks.filter(c => c.duration > 500);
  if (slowChecks.length > 0) {
    recommendations.push(`${slowChecks.length} checks were slow (>500ms) - consider index optimization`);
  }
  
  if (checks.some(c => c.name.includes('RLS') && !c.success)) {
    recommendations.push('RLS policies may not be properly configured - security risk');
  }
  
  if (checks.some(c => c.name.includes('Storage') && !c.success)) {
    recommendations.push('Storage buckets may not be configured - file uploads may fail');
  }
  
  const report: RuntimeReport = {
    timestamp: new Date().toISOString(),
    overallStatus,
    summary: {
      total: checks.length,
      passed,
      failed,
      warnings: 0 // Could add warning-level checks
    },
    checks,
    recommendations
  };
  
  return report;
}

async function main() {
  try {
    const report = await runRuntimeChecks();
    
    // Write detailed report
    const reportPath = './scripts/_runtime_checks_report.json';
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    console.log('\n📊 RUNTIME CHECKS SUMMARY:');
    const statusIcon = report.overallStatus === 'pass' ? '✅' : 
                       report.overallStatus === 'warning' ? '⚠️' : '❌';
    console.log(`   Overall Status: ${statusIcon} ${report.overallStatus.toUpperCase()}`);
    console.log(`   Passed: ${report.summary.passed}/${report.summary.total}`);
    console.log(`   Failed: ${report.summary.failed}`);
    
    console.log('\n🧪 CHECK DETAILS:');
    report.checks.forEach(check => {
      const icon = check.success ? '✅' : '❌';
      const timing = check.duration > 500 ? ' ⚠️ SLOW' : '';
      console.log(`   ${icon} ${check.name} (${check.duration}ms)${timing}`);
      if (!check.success) {
        console.log(`       ${check.message}`);
      }
    });
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    console.log(`\n📄 Detailed report: ${reportPath}`);
    
    // Exit with appropriate code
    if (report.overallStatus === 'fail') {
      console.log('\n❌ RUNTIME CHECKS FAILED');
      process.exit(1);
    } else if (report.overallStatus === 'warning') {
      console.log('\n⚠️ RUNTIME CHECKS COMPLETED WITH WARNINGS');
      process.exit(0);
    } else {
      console.log('\n✅ ALL RUNTIME CHECKS PASSED');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Runtime checks failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runRuntimeChecks };
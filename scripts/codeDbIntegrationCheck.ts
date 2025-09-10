#!/usr/bin/env tsx
/**
 * Code ↔ Database Integration Checker
 * Scans TypeScript source to find all DB table/function/bucket references
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface DatabaseReference {
  type: 'table' | 'rpc' | 'storage_bucket';
  name: string;
  file: string;
  line: number;
  context: string;
}

interface IntegrationReport {
  scanMetadata: {
    scannedAt: string;
    filesScanned: number;
    totalReferences: number;
  };
  references: {
    tables: DatabaseReference[];
    rpcs: DatabaseReference[];
    storageBuckets: DatabaseReference[];
  };
  analysis: {
    referencedTables: string[];
    referencedRpcs: string[];
    referencedBuckets: string[];
    missingTables: string[];
    missingRpcs: string[];
    missingBuckets: string[];
  };
}

// Known database schema from introspection
const KNOWN_TABLES = [
  'worlds', 'entities', 'templates', 'folders', 'relationships',
  'profiles', 'world_members', 'world_invites', 'world_bans',
  'world_files', 'activity_logs'
];

const KNOWN_BUCKETS = [
  'world-assets', 'public.world_files'
];

async function scanCodeForDbReferences(): Promise<IntegrationReport> {
  console.log('🔍 Scanning codebase for database references...');

  const references: IntegrationReport['references'] = {
    tables: [],
    rpcs: [],
    storageBuckets: []
  };

  // Find all TypeScript files
  const files = await glob('src/**/*.{ts,tsx}', { 
    cwd: process.cwd(),
    ignore: ['**/*.d.ts', '**/node_modules/**']
  });

  console.log(`📁 Found ${files.length} TypeScript files to scan`);

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Find .from('table_name') patterns (but not .storage.from)
        if (!line.includes('.storage.from')) {
          const tableMatches = line.match(/\.from\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
          if (tableMatches) {
            tableMatches.forEach(match => {
              const tableName = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
              if (tableName) {
                references.tables.push({
                  type: 'table',
                  name: tableName,
                  file,
                  line: lineNumber,
                  context: line.trim()
                });
              }
            });
          }
        }

        // Find .rpc('function_name') patterns
        const rpcMatches = line.match(/\.rpc\s*\(\s*['"`]([^'"`]+)['"`]/g);
        if (rpcMatches) {
          rpcMatches.forEach(match => {
            const rpcName = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
            if (rpcName) {
              references.rpcs.push({
                type: 'rpc',
                name: rpcName,
                file,
                line: lineNumber,
                context: line.trim()
              });
            }
          });
        }

        // Find .storage.from('bucket_name') patterns
        const storageMatches = line.match(/\.storage\.from\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
        if (storageMatches) {
          storageMatches.forEach(match => {
            const bucketName = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
            if (bucketName) {
              references.storageBuckets.push({
                type: 'storage_bucket',
                name: bucketName,
                file,
                line: lineNumber,
                context: line.trim()
              });
            }
          });
        }
      });
    } catch (error) {
      console.warn(`⚠️ Could not read file ${file}:`, error);
    }
  }

  // Analyze references
  const referencedTables = [...new Set(references.tables.map(r => r.name))];
  const referencedRpcs = [...new Set(references.rpcs.map(r => r.name))];
  const referencedBuckets = [...new Set(references.storageBuckets.map(r => r.name))];

  const missingTables = referencedTables.filter(table => !KNOWN_TABLES.includes(table));
  const missingRpcs = referencedRpcs; // We don't have RPC introspection yet
  const missingBuckets = referencedBuckets.filter(bucket => !KNOWN_BUCKETS.includes(bucket));

  const report: IntegrationReport = {
    scanMetadata: {
      scannedAt: new Date().toISOString(),
      filesScanned: files.length,
      totalReferences: references.tables.length + references.rpcs.length + references.storageBuckets.length
    },
    references,
    analysis: {
      referencedTables,
      referencedRpcs,
      referencedBuckets,
      missingTables,
      missingRpcs,
      missingBuckets
    }
  };

  console.log('📊 Scan Summary:');
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Table references: ${references.tables.length}`);
  console.log(`   RPC references: ${references.rpcs.length}`);
  console.log(`   Storage references: ${references.storageBuckets.length}`);
  console.log(`   Referenced tables: ${referencedTables.length}`);
  console.log(`   Missing tables: ${missingTables.length}`);

  if (missingTables.length > 0) {
    console.log('❌ Missing tables:', missingTables);
  }

  if (missingBuckets.length > 0) {
    console.log('❌ Missing buckets:', missingBuckets);
  }

  return report;
}

async function main() {
  try {
    const report = await scanCodeForDbReferences();
    
    // Write to file
    const outputPath = './scripts/_integration_report.json';
    writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    
    console.log(`\n📄 Integration report written to: ${outputPath}`);
    
    // Print detailed analysis
    console.log('\n🔍 DETAILED ANALYSIS:');
    
    console.log('\n📋 Referenced Tables:');
    report.analysis.referencedTables.forEach(table => {
      const count = report.references.tables.filter(r => r.name === table).length;
      const exists = KNOWN_TABLES.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table} (${count} references)`);
    });

    console.log('\n⚙️ Referenced RPCs:');
    if (report.analysis.referencedRpcs.length === 0) {
      console.log('   No RPC references found');
    } else {
      report.analysis.referencedRpcs.forEach(rpc => {
        const count = report.references.rpcs.filter(r => r.name === rpc).length;
        console.log(`   🔶 ${rpc} (${count} references) - Status unknown`);
      });
    }

    console.log('\n🪣 Referenced Storage Buckets:');
    if (report.analysis.referencedBuckets.length === 0) {
      console.log('   No storage bucket references found');
    } else {
      report.analysis.referencedBuckets.forEach(bucket => {
        const count = report.references.storageBuckets.filter(r => r.name === bucket).length;
        const exists = KNOWN_BUCKETS.includes(bucket);
        console.log(`   ${exists ? '✅' : '❌'} ${bucket} (${count} references)`);
      });
    }

    // Exit with error if there are issues
    const hasIssues = report.analysis.missingTables.length > 0 || report.analysis.missingBuckets.length > 0;
    
    if (hasIssues) {
      console.log('\n❌ INTEGRATION ISSUES DETECTED');
      process.exit(1);
    } else {
      console.log('\n✅ ALL REFERENCES LOOK GOOD');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Integration check failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { scanCodeForDbReferences };
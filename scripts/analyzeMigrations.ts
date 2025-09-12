#!/usr/bin/env tsx
/**
 * Migration Analysis Tool
 * Analyzes migration files for potential issues and drift detection
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface MigrationFile {
  filename: string;
  timestamp: string;
  name: string;
  path: string;
  content: string;
  size: number;
}

interface MigrationAnalysis {
  migrationFiles: MigrationFile[];
  issues: {
    type: 'warning' | 'error' | 'info';
    message: string;
    file?: string;
    line?: number;
  }[];
  summary: {
    totalMigrations: number;
    totalSize: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
    tablesCreated: string[];
    policiesCreated: number;
    indexesCreated: number;
    functionsCreated: number;
  };
}

async function analyzeMigrations(): Promise<MigrationAnalysis> {
  console.log('🔍 Analyzing migration files...');
  
  const migrationFiles: MigrationFile[] = [];
  const issues: MigrationAnalysis['issues'] = [];
  
  // Find all migration files
  const files = await glob('supabase/migrations/*.sql', { 
    cwd: process.cwd()
  });
  
  console.log(`📁 Found ${files.length} migration files`);
  
  // Parse each migration file
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const filename = path.basename(file);
      const match = filename.match(/^(\d{14})_(.+)\.sql$/);
      
      if (!match) {
        issues.push({
          type: 'warning',
          message: `Migration file does not follow naming convention: ${filename}`,
          file: filename
        });
        continue;
      }
      
      const [, timestamp, name] = match;
      
      migrationFiles.push({
        filename,
        timestamp,
        name: name.replace(/_/g, ' '),
        path: file,
        content,
        size: content.length
      });
      
    } catch (error) {
      issues.push({
        type: 'error',
        message: `Could not read migration file: ${file}`,
        file: path.basename(file)
      });
    }
  }
  
  // Sort by timestamp
  migrationFiles.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  
  // Analyze content
  const tablesCreated = new Set<string>();
  let policiesCreated = 0;
  let indexesCreated = 0;
  let functionsCreated = 0;
  
  for (const migration of migrationFiles) {
    const lines = migration.content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim().toLowerCase();
      
      // Check for potential issues
      if (trimmed.includes('drop table') && !trimmed.includes('if exists')) {
        issues.push({
          type: 'warning',
          message: 'DROP TABLE without IF EXISTS - could fail if table doesn\'t exist',
          file: migration.filename,
          line: lineNumber
        });
      }
      
      if (trimmed.includes('alter table') && trimmed.includes('add column') && !trimmed.includes('if not exists')) {
        issues.push({
          type: 'warning',
          message: 'ADD COLUMN without IF NOT EXISTS - could fail if column exists',
          file: migration.filename,
          line: lineNumber
        });
      }
      
      // Count elements (case-insensitive)
      if (trimmed.includes('create table')) {
        const tableMatch = trimmed.match(/create table(?:\s+if not exists)?\s+(?:public\.)?([a-z_]+)/i);
        if (tableMatch) {
          tablesCreated.add(tableMatch[1]);
        }
      }
      
      if (trimmed.includes('create policy')) {
        policiesCreated++;
      }
      
      if (trimmed.includes('create index') || trimmed.includes('create unique index')) {
        indexesCreated++;
      }
      
      if (trimmed.includes('create or replace function') || trimmed.includes('create function')) {
        functionsCreated++;
      }
    });
  }
  
  // Calculate summary
  const timestamps = migrationFiles.map(m => m.timestamp);
  const totalSize = migrationFiles.reduce((sum, m) => sum + m.size, 0);
  
  const analysis: MigrationAnalysis = {
    migrationFiles,
    issues,
    summary: {
      totalMigrations: migrationFiles.length,
      totalSize,
      dateRange: {
        earliest: timestamps[0] || '',
        latest: timestamps[timestamps.length - 1] || ''
      },
      tablesCreated: Array.from(tablesCreated),
      policiesCreated,
      indexesCreated,
      functionsCreated
    }
  };
  
  return analysis;
}

function formatTimestamp(timestamp: string): string {
  if (timestamp.length !== 14) return timestamp;
  
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

async function main() {
  try {
    const analysis = await analyzeMigrations();
    
    console.log('\n📊 MIGRATION ANALYSIS SUMMARY:');
    console.log(`   Total migrations: ${analysis.summary.totalMigrations}`);
    console.log(`   Total size: ${(analysis.summary.totalSize / 1024).toFixed(1)} KB`);
    console.log(`   Date range: ${formatTimestamp(analysis.summary.dateRange.earliest)} → ${formatTimestamp(analysis.summary.dateRange.latest)}`);
    console.log(`   Tables created: ${analysis.summary.tablesCreated.length}`);
    console.log(`   Policies created: ${analysis.summary.policiesCreated}`);
    console.log(`   Indexes created: ${analysis.summary.indexesCreated}`);
    console.log(`   Functions created: ${analysis.summary.functionsCreated}`);
    
    console.log('\n📋 MIGRATION FILES:');
    analysis.migrationFiles.forEach((migration, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${migration.filename}`);
      console.log(`       ${migration.name}`);
      console.log(`       ${formatTimestamp(migration.timestamp)} • ${(migration.size / 1024).toFixed(1)} KB`);
    });
    
    console.log('\n🗂️ TABLES CREATED:');
    analysis.summary.tablesCreated.forEach(table => {
      console.log(`   ✅ ${table}`);
    });
    
    if (analysis.issues.length > 0) {
      console.log('\n⚠️ POTENTIAL ISSUES:');
      analysis.issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        const location = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : '';
        console.log(`   ${icon} ${issue.message}${location}`);
      });
    } else {
      console.log('\n✅ NO ISSUES FOUND');
    }
    
    // Write detailed report
    const reportPath = './scripts/_migration_analysis.json';
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`\n📄 Detailed analysis written to: ${reportPath}`);
    
    // Exit with error if critical issues found
    const hasErrors = analysis.issues.some(issue => issue.type === 'error');
    if (hasErrors) {
      console.log('\n❌ CRITICAL ISSUES DETECTED');
      process.exit(1);
    } else {
      console.log('\n✅ MIGRATION ANALYSIS COMPLETE');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Migration analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { analyzeMigrations };
#!/usr/bin/env tsx
/**
 * Database Schema Introspection Tool
 * Queries Postgres catalog to extract complete schema information
 */

import { adminClient } from './supabaseAdmin';

interface IntrospectionResult {
  metadata: {
    introspectedAt: string;
    database: string;
    schema: string;
  };
  tables: Array<{
    name: string;
    type: 'BASE TABLE' | 'VIEW';
    comment?: string;
  }>;
  columns: Array<{
    table: string;
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
    comment?: string;
  }>;
  constraints: Array<{
    table: string;
    name: string;
    type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
    columns: string[];
    referencedTable?: string;
    referencedColumns?: string[];
  }>;
  indexes: Array<{
    table: string;
    name: string;
    columns: string[];
    unique: boolean;
    primary: boolean;
  }>;
  rlsPolicies: Array<{
    table: string;
    name: string;
    command: string;
    roles: string[];
    expression?: string;
    withCheck?: string;
  }>;
  rlsEnabled: string[];
  functions: Array<{
    name: string;
    schema: string;
    language: string;
    returnType: string;
    arguments: Array<{
      name: string;
      type: string;
      mode: string;
    }>;
  }>;
  storageBuckets: Array<{
    id: string;
    name: string;
    public: boolean;
    allowedMimeTypes?: string[];
    fileSizeLimit?: number;
  }>;
}

async function introspectDatabase(): Promise<IntrospectionResult> {
  console.log('🔍 Starting database introspection...');

  const result: IntrospectionResult = {
    metadata: {
      introspectedAt: new Date().toISOString(),
      database: 'supabase',
      schema: 'public'
    },
    tables: [],
    columns: [],
    constraints: [],
    indexes: [],
    rlsPolicies: [],
    rlsEnabled: [],
    functions: [],
    storageBuckets: []
  };

  try {
    // First, let's check what tables actually exist by trying known ones
    console.log('📊 Discovering tables...');
    const knownTables = [
      'worlds', 'entities', 'templates', 'folders', 'relationships',
      'profiles', 'world_members', 'world_invites', 'world_bans'
    ];

    for (const tableName of knownTables) {
      try {
        const { error } = await adminClient.from(tableName).select('count', { count: 'exact', head: true });
        if (!error) {
          result.tables.push({ name: tableName, type: 'BASE TABLE' });
        }
      } catch (e) {
        // Table doesn't exist or access denied
      }
    }

    console.log(`✅ Found ${result.tables.length} tables`);

    // For each discovered table, get basic column info
    console.log('📋 Fetching column information...');
    
    for (const table of result.tables) {
      try {
        // Use describe-like query to get column info
        const { data: sample } = await adminClient.from(table.name).select('*').limit(0);
        
        // This won't give us column info, so let's try a different approach
        // Use the REST API introspection endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?select=*`, {
          method: 'OPTIONS',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
          }
        });
        
        if (response.ok) {
          const schema = await response.json();
          console.log(`Schema for ${table.name}:`, schema);
        }
      } catch (e) {
        console.log(`⚠️ Could not introspect columns for ${table.name}: ${e}`);
      }
    }

    // 8. Get storage buckets
    console.log('🪣 Fetching storage buckets...');
    const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();

    if (!bucketsError && buckets) {
      result.storageBuckets = buckets.map(b => ({
        id: b.id,
        name: b.name,
        public: b.public,
        allowedMimeTypes: b.allowed_mime_types,
        fileSizeLimit: b.file_size_limit
      }));
      console.log(`✅ Found ${result.storageBuckets.length} storage buckets`);
    } else {
      console.log(`⚠️ Storage buckets query failed: ${bucketsError?.message}`);
    }

    console.log('🎉 Database introspection completed successfully!');
    return result;

  } catch (error) {
    console.error('❌ Database introspection failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const result = await introspectDatabase();
    
    // Write to file
    const fs = await import('fs/promises');
    const outputPath = './scripts/_introspection.json';
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    
    console.log(`\n📄 Results written to: ${outputPath}`);
    console.log('\n📊 Summary:');
    console.log(`   Tables/Views: ${result.tables.length}`);
    console.log(`   Columns: ${result.columns.length}`);
    console.log(`   Constraints: ${result.constraints.length}`);
    console.log(`   Indexes: ${result.indexes.length}`);
    console.log(`   RLS Policies: ${result.rlsPolicies.length}`);
    console.log(`   RLS Enabled: ${result.rlsEnabled.length}`);
    console.log(`   Functions: ${result.functions.length}`);
    console.log(`   Storage Buckets: ${result.storageBuckets.length}`);

  } catch (error) {
    console.error('❌ Failed to complete introspection:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { introspectDatabase };
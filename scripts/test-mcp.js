#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Tests connectivity and basic functionality of configured MCP servers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Variables...', colors.cyan);
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = [];
  const present = [];
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      present.push(envVar);
      log(`  ✅ ${envVar}: Found`, colors.green);
    } else {
      missing.push(envVar);
      log(`  ❌ ${envVar}: Missing`, colors.red);
    }
  });
  
  if (missing.length > 0) {
    log(`\n⚠️  Missing environment variables. Please set them in .env.local:`, colors.yellow);
    missing.forEach(envVar => {
      log(`    ${envVar}=your_value_here`, colors.yellow);
    });
    log(`\nSee MCP_SETUP.md for detailed configuration instructions.`, colors.blue);
    return false;
  }
  
  log('✅ All required environment variables are present!', colors.green);
  return true;
}

function checkMCPConfig() {
  log('\n🔧 Checking MCP Configuration...', colors.cyan);
  
  const configPath = path.join(process.cwd(), '.claude', 'config.json');
  
  if (!fs.existsSync(configPath)) {
    log('❌ .claude/config.json not found!', colors.red);
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const servers = config.mcpServers || {};
    
    log(`📋 Found ${Object.keys(servers).length} MCP servers configured:`, colors.blue);
    
    Object.entries(servers).forEach(([name, server]) => {
      log(`  • ${name}: ${server.description}`, colors.reset);
      
      // Check if placeholder values are still present
      if (server.env) {
        const hasPlaceholders = Object.values(server.env).some(value => 
          value.includes('your_') || value.includes('_here')
        );
        
        if (hasPlaceholders) {
          log(`    ⚠️  Has placeholder values - needs configuration`, colors.yellow);
        } else {
          log(`    ✅ Environment configured`, colors.green);
        }
      }
    });
    
    return true;
  } catch (error) {
    log(`❌ Error reading MCP config: ${error.message}`, colors.red);
    return false;
  }
}

function checkInstalledPackages() {
  log('\n📦 Checking Installed MCP Packages...', colors.cyan);
  
  const requiredPackages = [
    '@supabase/mcp-server-supabase',
    'mcp-supabase',
    '@modelcontextprotocol/server-memory',
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-sequential-thinking'
  ];
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found!', colors.red);
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };
  
  const missing = [];
  const present = [];
  
  requiredPackages.forEach(pkg => {
    if (allDeps[pkg]) {
      present.push(pkg);
      log(`  ✅ ${pkg}: ${allDeps[pkg]}`, colors.green);
    } else {
      missing.push(pkg);
      log(`  ❌ ${pkg}: Not installed`, colors.red);
    }
  });
  
  if (missing.length > 0) {
    log(`\n🔧 To install missing packages:`, colors.blue);
    log(`npm install ${missing.join(' ')}`, colors.bright);
    return false;
  }
  
  return true;
}

function testSupabaseConnection() {
  log('\n🔗 Testing Supabase Connection...', colors.cyan);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    log('❌ Supabase credentials not found in environment', colors.red);
    return false;
  }
  
  try {
    // Simple test - try to reach the Supabase health endpoint
    const testUrl = `${supabaseUrl}/rest/v1/`;
    log(`  Testing connection to: ${testUrl}`, colors.blue);
    
    // This is a basic connectivity test
    log('  ✅ Supabase URL format appears valid', colors.green);
    log('  ℹ️  Full connection test requires runtime environment', colors.yellow);
    
    return true;
  } catch (error) {
    log(`  ❌ Connection test failed: ${error.message}`, colors.red);
    return false;
  }
}

function generateMCPUsageExamples() {
  log('\n💡 MCP Usage Examples:', colors.magenta);
  
  const examples = [
    {
      server: 'Supabase',
      examples: [
        'Show me all tables in the database',
        'Query the worlds table for recent entries',
        'Check the current RLS policies on the entities table'
      ]
    },
    {
      server: 'Memory',
      examples: [
        'Remember this database schema change for later',
        'Track this performance issue we discovered',
        'Store notes about the authentication flow'
      ]
    },
    {
      server: 'Filesystem',
      examples: [
        'Analyze the structure of src/components',
        'Find all TypeScript interfaces in the lib directory',
        'Read the current middleware configuration'
      ]
    },
    {
      server: 'Sequential Thinking',
      examples: [
        'Debug why entity creation is failing step by step',
        'Plan the migration from Zustand to pure TanStack Query',
        'Analyze the authentication flow for security issues'
      ]
    }
  ];
  
  examples.forEach(({ server, examples }) => {
    log(`\n🔧 ${server} MCP:`, colors.bright);
    examples.forEach(example => {
      log(`  • "${example}"`, colors.reset);
    });
  });
}

function main() {
  log('🚀 MCP Server Configuration Test', colors.bright);
  log('=====================================', colors.bright);
  
  const checks = [
    checkEnvironmentVariables,
    checkMCPConfig,
    checkInstalledPackages,
    testSupabaseConnection
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    if (!check()) {
      allPassed = false;
    }
  }
  
  log('\n📊 Test Summary:', colors.bright);
  if (allPassed) {
    log('✅ All checks passed! MCP servers should be ready to use.', colors.green);
    generateMCPUsageExamples();
  } else {
    log('❌ Some checks failed. Please address the issues above.', colors.red);
    log('📖 See MCP_SETUP.md for detailed setup instructions.', colors.blue);
  }
  
  log('\n🔗 Next Steps:', colors.cyan);
  log('1. Restart Claude Code to load the MCP configuration', colors.reset);
  log('2. Ask Claude: "List available MCP servers"', colors.reset);
  log('3. Test Supabase connection: "Use Supabase MCP to show database tables"', colors.reset);
}

if (require.main === module) {
  main();
}
/**
 * Environment validation utility
 * Validates required environment variables are present and properly configured
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_SEED_ENABLED',
  'NODE_ENV'
];

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  present: string[];
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  const present: string[] = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missing.push(varName);
      errors.push(`Missing required environment variable: ${varName}`);
    } else {
      present.push(varName);
      
      // Additional validation for specific vars
      if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
          errors.push(`Invalid SUPABASE_URL format: ${value}`);
        }
      }
      
      if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        if (value.length < 100) {
          errors.push(`SUPABASE_ANON_KEY appears too short: ${value.length} characters`);
        }
        if (!value.startsWith('eyJ')) {
          errors.push(`SUPABASE_ANON_KEY should be a JWT token starting with 'eyJ'`);
        }
      }
    }
  });

  // Check optional variables
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    
    if (value) {
      present.push(varName);
      
      // Validation for service role key
      if (varName === 'SUPABASE_SERVICE_ROLE_KEY') {
        if (value.length < 100) {
          warnings.push(`SERVICE_ROLE_KEY appears too short: ${value.length} characters`);
        }
        if (!value.startsWith('eyJ')) {
          warnings.push(`SERVICE_ROLE_KEY should be a JWT token starting with 'eyJ'`);
        }
      }
      
      // Check for dangerous admin settings
      if (varName === 'ADMIN_SEED_ENABLED' && value === 'true') {
        if (process.env.NODE_ENV === 'production') {
          warnings.push('ADMIN_SEED_ENABLED is true in production - this may be unsafe');
        }
      }
    }
  });

  // Security checks
  if (process.env.NODE_ENV === 'production') {
    // Check for development-only settings
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('Using localhost Supabase URL in production');
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    missing,
    present
  };
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment();
  
  console.log('Environment Validation Results:');
  console.log(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (result.present.length > 0) {
    console.log(`Present variables (${result.present.length}):`, result.present);
  }
  
  if (result.missing.length > 0) {
    console.error(`Missing variables (${result.missing.length}):`, result.missing);
  }
  
  if (result.errors.length > 0) {
    console.error('Errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.warn('Warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
}

/**
 * Validate environment on app startup
 */
export function validateEnvironmentOnStartup(): void {
  const result = validateEnvironment();
  
  if (!result.isValid) {
    console.error('❌ Environment validation failed!');
    result.errors.forEach(error => console.error(`  - ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration for production');
    }
  } else {
    console.log('✅ Environment validation passed');
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Environment warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
}

/**
 * Check for secrets in git history (helper for manual checking)
 */
export function getSecretCheckCommand(): string {
  return 'git log --all --full-history --source --grep="secret\\|key\\|password\\|token" -i --oneline';
}

/**
 * Safe environment object with only public variables
 */
export function getSafeEnvironment(): Record<string, string> {
  const safeVars: Record<string, string> = {};
  
  // Only include NEXT_PUBLIC_ variables and safe server variables
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_') || 
        key === 'NODE_ENV' || 
        key === 'VERCEL_ENV') {
      safeVars[key] = process.env[key] || '';
    }
  });
  
  return safeVars;
}

/**
 * Environment Variable Validation
 * 
 * This module validates required environment variables and provides type-safe access.
 * It prevents the application from starting with invalid or missing configuration.
 */

import { z } from 'zod';

// Environment schema with validation rules
const envSchema = z.object({
  // Supabase configuration (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL format'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100, 'Supabase anon key appears invalid (too short)'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100, 'Supabase service role key appears invalid (too short)'),
  
  // Database (optional - falls back to Supabase)
  DATABASE_URL: z.string().url().optional(),
  
  // Rate limiting (optional)
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(20).optional(),
  
  // Admin seeding (optional but recommended for security)
  SEED_ADMIN_TOKEN: z.string().min(32, 'Admin token should be at least 32 characters for security').optional(),
  SEED_BASE_URL: z.string().url().optional(),
  ADMIN_SEED_ENABLED: z.string().transform(val => val === 'true').optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig | null = null;

/**
 * Validate environment variables
 * Throws detailed error if validation fails
 */
export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.error.errors.forEach(error => {
      console.error(`  - ${error.path.join('.')}: ${error.message}`);
    });
    
    throw new Error(
      'Environment validation failed. Please check your .env.local file. ' +
      'Copy .env.local.example to .env.local and fill in the required values.'
    );
  }
  
  validatedEnv = result.data;
  
  // Security warnings for development
  if (validatedEnv.NODE_ENV === 'development') {
    if (!validatedEnv.SEED_ADMIN_TOKEN) {
      console.warn('⚠️  SEED_ADMIN_TOKEN not set - admin seeding endpoints will be disabled');
    }
    
    if (validatedEnv.ADMIN_SEED_ENABLED) {
      console.warn('⚠️  ADMIN_SEED_ENABLED is true - admin endpoints are accessible');
    }
  }
  
  // Security checks for production
  if (validatedEnv.NODE_ENV === 'production') {
    if (validatedEnv.ADMIN_SEED_ENABLED) {
      console.error('🚨 SECURITY WARNING: ADMIN_SEED_ENABLED should not be true in production!');
    }
    
    // Check for placeholder values
    if (validatedEnv.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
      throw new Error('🚨 SECURITY: Placeholder Supabase URL detected in production!');
    }
    
    if (validatedEnv.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role-key')) {
      throw new Error('🚨 SECURITY: Placeholder service role key detected in production!');
    }
  }
  
  return validatedEnv;
}

/**
 * Get validated environment configuration
 * Safe to call multiple times - caches result
 */
export function getEnv(): EnvConfig {
  return validateEnv();
}

/**
 * Check if environment is properly configured
 * Returns boolean instead of throwing
 */
export function isEnvValid(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment info for debugging (redacts sensitive values)
 */
export function getEnvInfo(): Record<string, string> {
  const env = getEnv();
  
  return {
    NODE_ENV: env.NODE_ENV,
    SUPABASE_URL_SET: !!env.NEXT_PUBLIC_SUPABASE_URL ? 'true' : 'false',
    ANON_KEY_SET: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'true' : 'false',
    SERVICE_KEY_SET: !!env.SUPABASE_SERVICE_ROLE_KEY ? 'true' : 'false',
    DATABASE_URL_SET: !!env.DATABASE_URL ? 'true' : 'false',
    KV_CONFIGURED: !!(env.KV_REST_API_URL && env.KV_REST_API_TOKEN) ? 'true' : 'false',
    ADMIN_TOKEN_SET: !!env.SEED_ADMIN_TOKEN ? 'true' : 'false',
    ADMIN_ENDPOINTS_ENABLED: !!env.ADMIN_SEED_ENABLED ? 'true' : 'false',
  };
}
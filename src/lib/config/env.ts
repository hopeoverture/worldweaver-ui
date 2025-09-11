/**
 * Environment Configuration and Validation
 * Validates required environment variables and provides type-safe access
 */

export interface AppConfig {
  // Application
  NODE_ENV: 'development' | 'production' | 'test'
  USE_DATABASE: boolean
  APP_SECRET: string
  
  // Database
  DATABASE_URL: string
  
  // Authentication
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string
  
  // Supabase (optional)
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  
  // Optional features
  OPENAI_API_KEY?: string
  NEXT_PUBLIC_GA_ID?: string
  SENTRY_DSN?: string
  
  // Development
  TEST_INVITE_EMAIL?: string
  SEED_ADMIN_TOKEN?: string
}

class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

function validateRequired(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new ConfigValidationError(`Missing required environment variable: ${key}`)
  }
  return value.trim()
}

function validateOptional(value: string | undefined): string | undefined {
  return value && value.trim() !== '' ? value.trim() : undefined
}

function validateBoolean(key: string, value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue
  
  const normalizedValue = value.toLowerCase().trim()
  if (normalizedValue === 'true' || normalizedValue === '1') return true
  if (normalizedValue === 'false' || normalizedValue === '0') return false
  
  throw new ConfigValidationError(`Invalid boolean value for ${key}: ${value}. Use 'true' or 'false'.`)
}

function validateNodeEnv(value: string | undefined): 'development' | 'production' | 'test' {
  const env = value?.trim() as 'development' | 'production' | 'test'
  
  if (!env || !['development', 'production', 'test'].includes(env)) {
    throw new ConfigValidationError(`Invalid NODE_ENV: ${value}. Must be 'development', 'production', or 'test'.`)
  }
  
  return env
}

function validateDatabaseUrl(url: string): string {
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new ConfigValidationError('DATABASE_URL must be a valid PostgreSQL connection string')
  }
  return url
}

function validateUrl(key: string, url: string): string {
  try {
    new URL(url)
    return url
  } catch {
    throw new ConfigValidationError(`Invalid URL for ${key}: ${url}`)
  }
}

function validateSecret(key: string, secret: string): string {
  if (secret.length < 32) {
    throw new ConfigValidationError(`${key} must be at least 32 characters long for security`)
  }
  return secret
}

/**
 * Load and validate environment configuration
 * This should be called once at application startup
 */
export function loadConfig(): AppConfig {
  try {
    const config: AppConfig = {
      // Application
      NODE_ENV: validateNodeEnv(process.env.NODE_ENV),
      USE_DATABASE: validateBoolean('USE_DATABASE', process.env.USE_DATABASE, true),
      APP_SECRET: validateSecret('APP_SECRET', validateRequired('APP_SECRET', process.env.APP_SECRET)),
      
      // Database
      DATABASE_URL: validateDatabaseUrl(validateRequired('DATABASE_URL', process.env.DATABASE_URL)),
      
      // Authentication
      NEXTAUTH_SECRET: validateSecret('NEXTAUTH_SECRET', validateRequired('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET)),
      NEXTAUTH_URL: validateUrl('NEXTAUTH_URL', validateRequired('NEXTAUTH_URL', process.env.NEXTAUTH_URL)),
      
      // Supabase (optional)
      NEXT_PUBLIC_SUPABASE_URL: validateOptional(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: validateOptional(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: validateOptional(process.env.SUPABASE_SERVICE_ROLE_KEY),
      
      // Optional features
      OPENAI_API_KEY: validateOptional(process.env.OPENAI_API_KEY),
      NEXT_PUBLIC_GA_ID: validateOptional(process.env.NEXT_PUBLIC_GA_ID),
      SENTRY_DSN: validateOptional(process.env.SENTRY_DSN),
      
      // Development
      TEST_INVITE_EMAIL: validateOptional(process.env.TEST_INVITE_EMAIL),
      SEED_ADMIN_TOKEN: validateOptional(process.env.SEED_ADMIN_TOKEN),
    }

    // Additional validations
    if (config.NODE_ENV === 'production') {
      if (config.APP_SECRET.includes('your-') || config.APP_SECRET.includes('generate-')) {
        throw new ConfigValidationError('APP_SECRET must be a real secret in production, not a placeholder')
      }
      
      if (config.NEXTAUTH_SECRET.includes('your-') || config.NEXTAUTH_SECRET.includes('generate-')) {
        throw new ConfigValidationError('NEXTAUTH_SECRET must be a real secret in production, not a placeholder')
      }
      
      if (config.NEXTAUTH_URL.includes('localhost')) {
        throw new ConfigValidationError('NEXTAUTH_URL must not be localhost in production')
      }
    }

    return config
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      console.error('❌ Environment Configuration Error:', error.message)
      console.error('Please check your .env.local file and ensure all required variables are set correctly.')
      console.error('See .env.example for the required format.')
    } else {
      console.error('❌ Unexpected error loading configuration:', error)
    }
    
    process.exit(1)
  }
}

// Global config instance
let config: AppConfig | null = null

/**
 * Get the validated configuration
 * Loads config on first call, returns cached version thereafter
 */
export function getConfig(): AppConfig {
  if (!config) {
    config = loadConfig()
  }
  return config
}

/**
 * Check if we're running in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === 'development'
}

/**
 * Check if we're running in production mode
 */
export function isProduction(): boolean {
  return getConfig().NODE_ENV === 'production'
}

/**
 * Check if we're running tests
 */
export function isTest(): boolean {
  return getConfig().NODE_ENV === 'test'
}

/**
 * Check if database usage is enabled
 */
export function isDatabaseEnabled(): boolean {
  return getConfig().USE_DATABASE
}
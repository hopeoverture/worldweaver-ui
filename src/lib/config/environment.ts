/**
 * Environment Configuration - Secure API Key Loading
 *
 * This module ensures proper environment variable precedence and security:
 * 1. .env.local takes highest precedence
 * 2. .env takes second precedence
 * 3. Windows system environment variables are lowest priority
 * 4. Prevents accidental overrides from Next.js or Windows
 * 5. Validates API key format and security
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Environment loading status
let envLoaded = false;
let envLoadError: string | null = null;

// Cached environment values (prevents re-reading)
const envCache = new Map<string, string>();

/**
 * Load environment variables in correct precedence order
 * This function should be called once at application startup
 */
export function loadEnvironmentVariables(): { success: boolean; error?: string } {
  if (envLoaded) {
    return { success: !envLoadError, error: envLoadError || undefined };
  }

  try {
    const projectRoot = process.cwd();

    // Step 1: Load .env first (lowest precedence)
    const envResult = dotenvConfig({
      path: resolve(projectRoot, '.env'),
      override: false // Don't override existing values
    });

    // Step 2: Load .env.local (highest precedence, can override .env)
    const envLocalResult = dotenvConfig({
      path: resolve(projectRoot, '.env.local'),
      override: true // Allow override of .env values
    });

    // Cache the final values
    cacheEnvironmentValues();

    envLoaded = true;
    return { success: true };
  } catch (error) {
    envLoadError = `Failed to load environment variables: ${(error as Error).message}`;
    return { success: false, error: envLoadError };
  }
}

/**
 * Cache important environment values to prevent runtime changes
 */
function cacheEnvironmentValues(): void {
  const importantVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL'
  ];

  for (const varName of importantVars) {
    const value = process.env[varName];
    if (value) {
      envCache.set(varName, value);
    }
  }
}

/**
 * Secure getter for OpenAI API key
 * Returns the cached value to prevent runtime manipulation
 */
export function getOpenAIApiKey(): string | null {
  // Ensure environment is loaded
  if (!envLoaded) {
    loadEnvironmentVariables();
  }

  // Return cached value (most secure)
  const cachedKey = envCache.get('OPENAI_API_KEY');
  if (cachedKey) {
    return cachedKey;
  }

  // Fallback to process.env (less secure but necessary for first load)
  const processKey = process.env.OPENAI_API_KEY;
  if (processKey) {
    // Cache it for future use
    envCache.set('OPENAI_API_KEY', processKey);
    return processKey;
  }

  return null;
}

/**
 * Validate OpenAI API key format and security
 */
export function validateOpenAIApiKey(apiKey?: string): {
  valid: boolean;
  error?: string;
  warnings?: string[]
} {
  const key = apiKey || getOpenAIApiKey();

  if (!key) {
    return {
      valid: false,
      error: 'OPENAI_API_KEY not found in environment variables'
    };
  }

  const warnings: string[] = [];

  // Check format
  if (!key.startsWith('sk-')) {
    return {
      valid: false,
      error: 'OpenAI API key must start with "sk-"'
    };
  }

  // Check length
  if (key.length < 50) {
    return {
      valid: false,
      error: 'OpenAI API key appears too short (should be 50+ characters)'
    };
  }

  // Security warnings
  if (key.length > 200) {
    warnings.push('API key is unusually long - verify it\'s correct');
  }

  // Check for project key format (more secure)
  if (!key.startsWith('sk-proj-')) {
    warnings.push('Consider using project-scoped API keys (sk-proj-...) for better security');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Get environment variable with fallback and caching
 */
export function getEnvironmentVariable(
  name: string,
  fallback?: string,
  options?: { cache?: boolean; sensitive?: boolean }
): string | undefined {
  const { cache = true, sensitive = false } = options || {};

  // Check cache first (if enabled)
  if (cache && envCache.has(name)) {
    return envCache.get(name);
  }

  // Get from process.env
  const value = process.env[name] || fallback;

  // Cache non-sensitive values
  if (value && cache && !sensitive) {
    envCache.set(name, value);
  }

  return value;
}

/**
 * Verify environment configuration is secure
 */
export function verifyEnvironmentSecurity(): {
  secure: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if .env.local exists (should for local development)
  try {
    const fs = require('fs');
    const envLocalExists = fs.existsSync(resolve(process.cwd(), '.env.local'));
    if (!envLocalExists) {
      issues.push('.env.local file not found - API keys may be exposed in .env');
      recommendations.push('Create .env.local file for local development secrets');
    }
  } catch (error) {
    issues.push('Could not check for .env.local file existence');
  }

  // Validate OpenAI key
  const keyValidation = validateOpenAIApiKey();
  if (!keyValidation.valid) {
    issues.push(`OpenAI API key issue: ${keyValidation.error}`);
  }
  if (keyValidation.warnings) {
    recommendations.push(...keyValidation.warnings);
  }

  // Check for potential override sources
  const windowsEnvKey = process.env.OPENAI_API_KEY;
  const cachedKey = envCache.get('OPENAI_API_KEY');

  if (windowsEnvKey && cachedKey && windowsEnvKey !== cachedKey) {
    issues.push('Windows environment variable differs from .env file - precedence may be unclear');
    recommendations.push('Remove OPENAI_API_KEY from Windows system environment');
  }

  return {
    secure: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * Environment configuration status
 */
export function getEnvironmentStatus(): {
  loaded: boolean;
  error: string | null;
  openaiConfigured: boolean;
  securityStatus: ReturnType<typeof verifyEnvironmentSecurity>;
} {
  return {
    loaded: envLoaded,
    error: envLoadError,
    openaiConfigured: !!getOpenAIApiKey(),
    securityStatus: verifyEnvironmentSecurity()
  };
}

// Auto-load environment on module import (for server-side)
if (typeof window === 'undefined') {
  loadEnvironmentVariables();
}
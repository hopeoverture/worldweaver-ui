/**
 * Startup Environment Validation
 *
 * This module runs environment validation checks on application startup
 * to ensure all required API keys are properly configured and secure.
 */

import { getEnvironmentStatus, loadEnvironmentVariables } from './environment';
import { logError } from '@/lib/logging';

export interface StartupValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Run comprehensive startup validation
 */
export async function validateStartupEnvironment(): Promise<StartupValidationResult> {
  const result: StartupValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    recommendations: []
  };

  try {
    // Step 1: Load environment variables
    console.log('🔧 Loading environment variables...');
    const envResult = loadEnvironmentVariables();

    if (!envResult.success && envResult.error) {
      result.errors.push(`Environment loading failed: ${envResult.error}`);
      result.success = false;
    }

    // Step 2: Check environment status
    const envStatus = getEnvironmentStatus();

    if (!envStatus.loaded) {
      result.errors.push('Environment variables not properly loaded');
      result.success = false;
    }

    if (envStatus.error) {
      result.errors.push(`Environment error: ${envStatus.error}`);
      result.success = false;
    }

    if (!envStatus.openaiConfigured) {
      result.errors.push('OpenAI API key not configured');
      result.success = false;
    }

    // Step 3: Security validation
    const securityStatus = envStatus.securityStatus;

    if (!securityStatus.secure) {
      result.warnings.push(...securityStatus.issues);
      // Don't mark as failure for security warnings, but log them
    }

    if (securityStatus.recommendations.length > 0) {
      result.recommendations.push(...securityStatus.recommendations);
    }

    // Step 4: Development vs Production checks
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isDevelopment) {
      result.recommendations.push('Running in development mode - ensure .env.local is configured');
    }

    if (isProduction) {
      // In production, we should have more strict validation
      if (envStatus.securityStatus.issues.length > 0) {
        result.errors.push('Security issues detected in production environment');
        result.success = false;
      }
    }

    // Step 5: Log results
    if (result.success) {
      console.log('✅ Environment validation passed');
      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:', result.warnings.join(', '));
      }
      if (result.recommendations.length > 0) {
        console.log('💡 Recommendations:', result.recommendations.join(', '));
      }
    } else {
      console.error('❌ Environment validation failed');
      console.error('Errors:', result.errors.join(', '));

      // Log to our error tracking system
      logError('Startup environment validation failed', new Error('Environment validation failed'), {
        action: 'startup_validation_failed',
        metadata: {
          errors: result.errors,
          warnings: result.warnings,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }

    return result;

  } catch (error) {
    const errorMessage = `Startup validation crashed: ${(error as Error).message}`;
    result.errors.push(errorMessage);
    result.success = false;

    console.error('💥 Startup validation crashed:', error);
    logError('Startup validation crashed', error as Error, {
      action: 'startup_validation_crashed'
    });

    return result;
  }
}

/**
 * Initialize environment and validate on server startup
 * This should be called early in the application lifecycle
 */
export async function initializeEnvironment(): Promise<void> {
  console.log('🚀 Initializing environment configuration...');

  const validation = await validateStartupEnvironment();

  if (!validation.success) {
    // In development, log errors but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Environment validation failed, but continuing in development mode');
      console.error('Errors:', validation.errors);
    } else {
      // In production, this is more serious
      console.error('❌ Critical environment validation failure in production');
      console.error('Errors:', validation.errors);

      // You could throw here to prevent startup if critical
      // throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }
  }

  console.log('✅ Environment initialization complete');
}

/**
 * Export validation result for external monitoring
 */
export function getLastValidationResult(): StartupValidationResult | null {
  // This could be expanded to store the last validation result
  // for health checks and monitoring endpoints
  return null;
}
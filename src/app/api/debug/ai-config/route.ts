import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIApiKey, validateOpenAIApiKey, getEnvironmentStatus } from '@/lib/config/environment';

/**
 * Debug endpoint to check AI configuration
 * This helps diagnose issues with environment variables and setup
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow debugging for authenticated users
    const apiKey = getOpenAIApiKey();
    const keyValidation = validateOpenAIApiKey(apiKey || undefined);
    const envStatus = getEnvironmentStatus();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAIKey: !!apiKey,
        openAIKeyLength: apiKey?.length || 0,
        openAIKeyPrefix: apiKey?.substring(0, 7) || 'none',
        openAIKeyValid: keyValidation.valid,
        openAIKeyValidationError: keyValidation.error,
        openAIKeyWarnings: keyValidation.warnings,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        environmentLoaded: envStatus.loaded,
        environmentError: envStatus.error,
        securityStatus: envStatus.securityStatus
      },
      packages: {
        hasAiSdk: (() => {
          try {
            require('ai');
            return true;
          } catch {
            return false;
          }
        })(),
        hasOpenAIProvider: (() => {
          try {
            require('@ai-sdk/openai');
            return true;
          } catch {
            return false;
          }
        })(),
        hasZod: (() => {
          try {
            require('zod');
            return true;
          } catch {
            return false;
          }
        })(),
      },
      user: {
        id: user.id,
        email: user.email
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        message: (error as Error).message,
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
}
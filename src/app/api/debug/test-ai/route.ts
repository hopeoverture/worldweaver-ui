import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Minimal AI test endpoint to isolate issues
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { testType = 'basic' } = body;

    const results: any = {
      timestamp: new Date().toISOString(),
      testType,
      steps: []
    };

    // Step 1: Check environment
    results.steps.push({
      step: 'environment_check',
      success: true,
      data: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length || 0
      }
    });

    // Step 2: Try importing packages
    try {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const { generateObject } = await import('ai');
      const { z } = await import('zod');

      results.steps.push({
        step: 'package_import',
        success: true,
        data: { message: 'All packages imported successfully' }
      });

      // Step 3: Try creating OpenAI client
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
      });

      results.steps.push({
        step: 'openai_client_creation',
        success: true,
        data: { message: 'OpenAI client created successfully' }
      });

      // Step 4: Try a minimal AI call
      if (testType === 'full') {
        const schema = z.object({
          message: z.string(),
          status: z.string()
        });

        try {
          // Try with standard model first
          const result = await generateObject({
            model: openai('gpt-4o-mini'),
            schema,
            system: 'You are a helpful assistant. Always respond with a JSON object containing a message and status.',
            prompt: 'Say hello and confirm everything is working'
          });

          results.steps.push({
            step: 'ai_call_standard_model',
            success: true,
            data: {
              model: 'gpt-4o-mini',
              result: result.object,
              usage: result.usage
            }
          });

          // Try with custom model
          try {
            const customResult = await generateObject({
              model: openai('gpt-5-mini'),
              schema,
              system: 'You are a helpful assistant. Always respond with a JSON object containing a message and status.',
              prompt: 'Say hello and confirm the custom model is working'
            });

            results.steps.push({
              step: 'ai_call_custom_model',
              success: true,
              data: {
                model: 'gpt-5-mini',
                result: customResult.object,
                usage: customResult.usage
              }
            });
          } catch (customError) {
            results.steps.push({
              step: 'ai_call_custom_model',
              success: false,
              error: {
                message: (customError as Error).message,
                name: (customError as Error).name,
                stack: (customError as Error).stack
              }
            });
          }
        } catch (aiError) {
          results.steps.push({
            step: 'ai_call_standard_model',
            success: false,
            error: {
              message: (aiError as Error).message,
              name: (aiError as Error).name,
              stack: (aiError as Error).stack
            }
          });
        }
      }

    } catch (importError) {
      results.steps.push({
        step: 'package_import',
        success: false,
        error: {
          message: (importError as Error).message,
          name: (importError as Error).name
        }
      });
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in test-ai endpoint:', error);
    return NextResponse.json(
      {
        error: 'Test endpoint failed',
        message: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, experimental_generateImage as generateImage } from 'ai';
import { z } from 'zod';
import { TemplateField, FieldType, World } from '@/lib/types';
import { logError } from '@/lib/logging';
import {
  calculateTextGenerationCost,
  calculateImageGenerationCost,
  type TokenUsage,
  type ImageGenerationParams
} from '@/lib/ai-pricing';
import { getOpenAIApiKey, validateOpenAIApiKey } from '@/lib/config/environment';

// Create configured OpenAI provider instance using secure environment loading
const openai = createOpenAI({
  apiKey: getOpenAIApiKey() || undefined,
  baseURL: 'https://api.openai.com/v1', // Ensure we're using the standard OpenAI endpoint
});

// Verify OpenAI configuration with enhanced validation
function ensureOpenAIConfigured() {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const validation = validateOpenAIApiKey(apiKey);
  if (!validation.valid) {
    throw new Error(`OpenAI API key validation failed: ${validation.error}`);
  }

  // Log warnings but don't throw
  if (validation.warnings) {
    validation.warnings.forEach(warning => {
      logError('OpenAI API key warning', new Error(warning), {
        action: 'openai_key_validation_warning',
        metadata: { warning }
      });
    });
  }
}

// Re-use existing interfaces from the original AI service
export type {
  AIUsageMetrics,
  AIGenerationResult,
  GenerateTemplateRequest,
  GenerateTemplateResponse,
  GenerateEntityFieldsRequest,
  GenerateEntityFieldsResponse,
  GenerateWorldFieldsRequest,
  GenerateWorldFieldsResponse,
  GenerateImageRequest,
  GenerateImageResponse
} from './aiService';

import type {
  AIUsageMetrics,
  AIGenerationResult,
  GenerateTemplateRequest,
  GenerateTemplateResponse,
  GenerateEntityFieldsRequest,
  GenerateEntityFieldsResponse,
  GenerateWorldFieldsRequest,
  GenerateWorldFieldsResponse,
  GenerateImageRequest,
  GenerateImageResponse
} from './aiService';

// Zod schemas for structured generation
const TemplateFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['shortText', 'longText', 'richText', 'number', 'select', 'multiSelect', 'image', 'reference']),
  prompt: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional()
});

const TemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  fields: z.array(TemplateFieldSchema)
});

const EntityFieldsSchema = z.record(z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.object({}).passthrough() // Allow any object structure for complex fields
]));

const WorldFieldsSchema = z.record(z.union([
  z.string(),
  z.array(z.string()),
  z.object({}).passthrough()
]));

/**
 * AI Service implementation using Vercel AI SDK
 * This service provides the same interface as the original AIService but uses
 * Vercel's AI SDK for better integration and type safety.
 */
export class AIServiceVercel {

  /**
   * Generate a template from a user prompt with world context using Vercel AI SDK
   */
  async generateTemplate({ prompt, worldContext }: GenerateTemplateRequest): Promise<AIGenerationResult<GenerateTemplateResponse>> {
    const startTime = Date.now();

    try {
      // Ensure OpenAI is properly configured
      ensureOpenAIConfigured();
      const contextPrompt = this.buildWorldContext(worldContext);

      const systemPrompt = `You are a worldbuilding assistant. Generate a template for a tabletop RPG or creative writing project.

${contextPrompt}

Generate a JSON object with this exact structure:
- name: A descriptive name for the template
- description: Brief description of what this template represents
- fields: Array of field objects with:
  - name: Field name (string)
  - type: One of: shortText, longText, richText, number, select, multiSelect, image, reference
  - prompt: AI generation prompt for this field (optional string)
  - required: Whether field is required (optional boolean)
  - options: Array of options for select/multiSelect fields (optional string array)

Include 3-8 relevant fields. Use appropriate field types. Always include a Name field as the first field.`;

      let result;
      try {
        result = await generateObject({
          model: openai('gpt-5-mini'), // Use the custom model specified by user
          schema: TemplateSchema,
          system: systemPrompt,
          prompt: `Generate a template for: ${prompt}`
        });
      } catch (modelError) {
        logError('Error calling Vercel AI generateObject', modelError as Error, {
          action: 'generate_template_vercel_model_call',
          metadata: {
            model: 'gpt-5-mini',
            hasApiKey: !!process.env.OPENAI_API_KEY
          }
        });
        throw new Error(`AI model call failed: ${(modelError as Error).message}`);
      }

      // Calculate usage metrics from Vercel AI response
      const responseTimeMs = Date.now() - startTime;
      const usage = result.usage;

      const tokenUsage: TokenUsage = {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0
      };

      const costBreakdown = calculateTextGenerationCost('gpt-5-mini', tokenUsage);
      const endTime = new Date();

      return {
        result: result.object,
        usage: {
          operation: 'template',
          model: 'gpt-5-mini',
          provider: 'openai',
          requestId: undefined, // Vercel AI doesn't provide request ID
          promptTokens: tokenUsage.inputTokens,
          completionTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costUsd: costBreakdown.totalCost,
          currency: 'USD',
          success: true,
          metadata: {
            worldContext: worldContext?.name || null,
            promptLength: prompt.length,
            finishReason: result.finishReason
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating template with Vercel AI', error as Error, { action: 'generate_template_vercel' });
      throw new Error(`Failed to generate template: ${(error as Error).message}`);
    }
  }

  /**
   * Generate entity field values based on template and context using Vercel AI SDK
   */
  async generateEntityFields({
    prompt,
    entityName,
    templateName,
    templateFields,
    existingFields = {},
    worldContext,
    generateAllFields = false,
    specificField
  }: GenerateEntityFieldsRequest): Promise<AIGenerationResult<GenerateEntityFieldsResponse>> {
    const startTime = Date.now();

    try {
      // Ensure OpenAI is properly configured
      ensureOpenAIConfigured();
      const contextPrompt = this.buildWorldContext(worldContext);

      const fieldsToGenerate = generateAllFields
        ? templateFields
        : templateFields.filter(f => specificField ? f.name === specificField : !existingFields[f.name]);

      if (fieldsToGenerate.length === 0) {
        return {
          result: { fields: {} },
          usage: {
            operation: 'entity_fields',
            model: 'gpt-5-mini',
            provider: 'openai',
            requestId: undefined,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            currency: 'USD',
            success: true,
            metadata: {},
            startedAt: new Date(startTime),
            finishedAt: new Date(),
            responseTimeMs: Date.now() - startTime
          }
        };
      }

      const systemPrompt = `You are a worldbuilding assistant. Generate content for entity fields in a tabletop RPG or creative writing project.

${contextPrompt}

Entity: ${entityName || 'Unnamed'}
Template: ${templateName || 'Unknown'}

Existing fields:
${Object.entries(existingFields).map(([key, value]) => `${key}: ${value}`).join('\n')}

Generate values for these fields:
${fieldsToGenerate.map(f => `- ${f.name} (${f.type})${f.prompt ? `: ${f.prompt}` : ''}`).join('\n')}

Return a JSON object with field names as keys and generated values as values.
For text fields, provide appropriate strings.
For number fields, provide numbers.
For select fields, choose from valid options if provided.
For multiSelect fields, provide arrays of strings.

Example format:
{
  "Field Name": "Generated value",
  "Number Field": 42,
  "Multi Select Field": ["option1", "option2"]
}`;

      const userPrompt = prompt
        ? `Additional context: ${prompt}\n\nGenerate the field values.`
        : 'Generate appropriate field values based on the context.';

      let result;
      try {
        result = await generateObject({
          model: openai('gpt-5-mini'),
          schema: EntityFieldsSchema,
          system: systemPrompt,
          prompt: userPrompt
        });
      } catch (modelError) {
        logError('Error calling Vercel AI generateObject for entity fields', modelError as Error, {
          action: 'generate_entity_fields_vercel_model_call',
          metadata: {
            model: 'gpt-5-mini',
            hasApiKey: !!process.env.OPENAI_API_KEY
          }
        });
        throw new Error(`AI model call failed: ${(modelError as Error).message}`);
      }

      // Calculate usage metrics
      const responseTimeMs = Date.now() - startTime;
      const usage = result.usage;

      const tokenUsage: TokenUsage = {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0
      };

      const costBreakdown = calculateTextGenerationCost('gpt-5-mini', tokenUsage);
      const endTime = new Date();

      return {
        result: { fields: result.object },
        usage: {
          operation: 'entity_fields',
          model: 'gpt-5-mini',
          provider: 'openai',
          requestId: undefined,
          promptTokens: tokenUsage.inputTokens,
          completionTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costUsd: costBreakdown.totalCost,
          currency: 'USD',
          success: true,
          metadata: {
            entityName: entityName || null,
            templateName: templateName || null,
            fieldsGenerated: Object.keys(result.object).length,
            worldContext: worldContext?.name || null,
            finishReason: result.finishReason
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating entity fields with Vercel AI', error as Error, {
        action: 'generate_entity_fields_vercel'
      });
      throw new Error(`Failed to generate entity fields: ${(error as Error).message}`);
    }
  }

  /**
   * Generate world field values based on existing data and context using Vercel AI SDK
   */
  async generateWorldFields({
    prompt,
    fieldsToGenerate,
    existingData = {}
  }: GenerateWorldFieldsRequest): Promise<AIGenerationResult<GenerateWorldFieldsResponse>> {
    const startTime = Date.now();

    try {
      // Ensure OpenAI is properly configured
      ensureOpenAIConfigured();
      const contextPrompt = this.buildWorldContext(existingData as any);

      // Build field descriptions for the AI
      const fieldDescriptions: Record<string, string> = {
        name: 'A creative and memorable name for the world',
        summary: 'A brief overview of the world, its key characteristics, and what makes it unique',
        logline: 'A compelling one-sentence description that captures the essence of the world',
        genreBlend: 'Array of relevant genre tags that define this world\'s style',
        overallTone: 'The emotional atmosphere and mood of the world',
        keyThemes: 'Array of central thematic elements that drive stories in this world',
        audienceRating: 'Appropriate audience rating based on content and themes',
        scopeScale: 'The geographic or dimensional scope of the world',
        technologyLevel: 'Array of technology levels present in the world',
        magicLevel: 'Array of magic system types and prevalence levels',
        cosmologyModel: 'The structure and nature of reality in this world',
        climateBiomes: 'Array of climate types and biomes present',
        calendarTimekeeping: 'Detailed description of how time is measured, including day/year length, seasons, celestial bodies, and significant cycles',
        societalOverview: 'Overview of civilizations, cultures, social structures, institutions, and economic patterns',
        conflictDrivers: 'Array of forces and factors that create tension and drive stories',
        rulesConstraints: 'Physical laws, magical rules, technological limitations, taboos, and other constraints that define what can and cannot happen',
        aestheticDirection: 'Visual style, architecture, fashion, art direction, textures, soundscape, and color palette'
      };

      const fieldsToGenerateDesc = fieldsToGenerate.map(field =>
        `- ${field}: ${fieldDescriptions[field] || 'Generate appropriate content for this field'}`
      ).join('\n');

      // Build existing data context
      const existingDataDesc = Object.entries(existingData)
        .filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`;
          }
          return `${key}: ${value}`;
        }).join('\n');

      const systemPrompt = `You are a worldbuilding assistant for tabletop RPGs and creative writing. Generate world field values that are creative, consistent, and thematically coherent.

${contextPrompt}

${existingDataDesc ? `Existing World Data:\n${existingDataDesc}\n` : ''}

Generate values for these fields:
${fieldsToGenerateDesc}

Return a JSON object with field names as keys and generated values as values.

For array fields (genreBlend, keyThemes, technologyLevel, magicLevel, climateBiomes, conflictDrivers), provide arrays of strings.
For string fields, provide descriptive text appropriate to the field type.
For calendarTimekeeping, societalOverview, rulesConstraints, and aestheticDirection, provide rich, detailed descriptions.

Ensure all generated content is consistent with existing data and maintains thematic coherence.

Example format:
{
  "name": "Generated World Name",
  "logline": "A compelling description...",
  "genreBlend": ["Fantasy", "Mystery"],
  "calendarTimekeeping": "Detailed time system description...",
  "societalOverview": "Rich societal description..."
}`;

      const userPrompt = prompt
        ? `Additional guidance: ${prompt}\n\nGenerate the requested world fields.`
        : 'Generate creative and consistent values for the requested world fields.';

      let result;
      try {
        // Try with the custom model first
        result = await generateObject({
          model: openai('gpt-5-mini'),
          schema: WorldFieldsSchema,
          system: systemPrompt,
          prompt: userPrompt
        });
      } catch (modelError) {
        // Log the full error details for debugging
        logError('Error calling Vercel AI generateObject for world fields with gpt-5-mini', modelError as Error, {
          action: 'generate_world_fields_vercel_model_call',
          metadata: {
            model: 'gpt-5-mini',
            hasApiKey: !!process.env.OPENAI_API_KEY,
            errorMessage: (modelError as Error).message,
            errorStack: (modelError as Error).stack,
            errorName: (modelError as Error).name
          }
        });

        // Try fallback to a known working model
        try {
          logError('Attempting fallback to gpt-4o-mini for world fields generation', new Error('Fallback attempt'), {
            action: 'generate_world_fields_fallback_attempt',
            metadata: {
              originalModel: 'gpt-5-mini',
              fallbackModel: 'gpt-4o-mini'
            }
          });

          result = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: WorldFieldsSchema,
            system: systemPrompt,
            prompt: userPrompt
          });

          logError('Fallback to gpt-4o-mini succeeded', new Error('Fallback success'), {
            action: 'generate_world_fields_fallback_success',
            metadata: {
              fallbackModel: 'gpt-4o-mini'
            }
          });
        } catch (fallbackError) {
          logError('Fallback model also failed', fallbackError as Error, {
            action: 'generate_world_fields_fallback_failed',
            metadata: {
              fallbackModel: 'gpt-4o-mini',
              originalError: (modelError as Error).message,
              fallbackErrorMessage: (fallbackError as Error).message
            }
          });
          throw new Error(`AI model call failed with both gpt-5-mini and gpt-4o-mini: ${(fallbackError as Error).message}`);
        }
      }

      // Calculate usage metrics
      const responseTimeMs = Date.now() - startTime;
      const usage = result.usage;

      const tokenUsage: TokenUsage = {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0
      };

      const costBreakdown = calculateTextGenerationCost('gpt-5-mini', tokenUsage);
      const endTime = new Date();

      return {
        result: { fields: result.object },
        usage: {
          operation: 'world_fields',
          model: 'gpt-5-mini',
          provider: 'openai',
          requestId: undefined,
          promptTokens: tokenUsage.inputTokens,
          completionTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costUsd: costBreakdown.totalCost,
          currency: 'USD',
          success: true,
          metadata: {
            fieldsToGenerate: fieldsToGenerate,
            fieldsGenerated: Object.keys(result.object).length,
            hasExistingData: Object.keys(existingData || {}).length > 0,
            finishReason: result.finishReason
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating world fields with Vercel AI', error as Error, {
        action: 'generate_world_fields_vercel'
      });
      throw new Error(`Failed to generate world fields: ${(error as Error).message}`);
    }
  }

  /**
   * Generate an image using Vercel AI SDK and upload to Supabase Storage
   */
  async generateImage({
    prompt,
    quality = 'medium'
  }: GenerateImageRequest): Promise<AIGenerationResult<GenerateImageResponse>> {
    const startTime = Date.now();

    try {
      // Ensure OpenAI is properly configured
      ensureOpenAIConfigured();
      // Map quality to size for the API
      const sizeMap = {
        low: '1024x1024',
        medium: '1024x1024',
        high: '1024x1024'
      } as const;

      // Use Vercel AI SDK for image generation
      const result = await generateImage({
        model: openai.image('gpt-image-1'), // Use the custom model specified by user
        prompt: prompt,
        size: sizeMap[quality],
        providerOptions: {
          openai: {
            quality: quality === 'high' ? 'hd' : 'standard',
            response_format: 'b64_json' // Get base64 for upload to Supabase
          }
        }
      });

      if (!result.image) {
        throw new Error('No image data returned from gpt-image-1');
      }

      // Convert base64 to blob and upload to Supabase Storage
      const imageUrl = await this.uploadImageToSupabase(result.image.base64, prompt);

      // Calculate usage metrics for image generation
      const responseTimeMs = Date.now() - startTime;
      const costBreakdown = calculateImageGenerationCost({ quality });

      const endTime = new Date();

      return {
        result: {
          imageUrl: imageUrl,
          revisedPrompt: prompt // Vercel AI doesn't provide revised prompt info
        },
        usage: {
          operation: 'image',
          model: 'gpt-image-1',
          provider: 'openai',
          requestId: undefined,
          promptTokens: 0, // Image generation doesn't use tokens in the same way
          completionTokens: 0,
          totalTokens: 0,
          costUsd: costBreakdown.imageCost,
          currency: 'USD',
          success: true,
          metadata: {
            imageQuality: quality,
            size: sizeMap[quality],
            revisedPrompt: prompt
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating image with Vercel AI', error as Error, {
        action: 'generate_image_vercel'
      });
      throw new Error(`Failed to generate image: ${(error as Error).message}`);
    }
  }

  /**
   * Generate an entity image based on entity data and world context
   */
  async generateEntityImage({
    entityName,
    templateName,
    entityFields,
    worldContext,
    customPrompt
  }: {
    entityName: string;
    templateName?: string;
    entityFields?: Record<string, unknown>;
    worldContext?: Pick<World, 'name' | 'description' | 'genreBlend' | 'overallTone' | 'keyThemes'>;
    customPrompt?: string;
  }): Promise<AIGenerationResult<GenerateImageResponse>> {
    try {
      let prompt = customPrompt || `A ${templateName || 'character'} named ${entityName}`;

      // Add world context
      if (worldContext) {
        if (worldContext.genreBlend?.length) {
          prompt += ` in a ${worldContext.genreBlend.join('/')} setting`;
        }
        if (worldContext.overallTone) {
          prompt += ` with a ${worldContext.overallTone} tone`;
        }
      }

      // Add relevant entity field details
      if (entityFields) {
        const relevantFields = ['appearance', 'description', 'look', 'physical', 'clothing', 'equipment'];
        const descriptions = relevantFields
          .map(field => entityFields[field])
          .filter(Boolean)
          .slice(0, 3); // Limit to avoid prompt overflow

        if (descriptions.length > 0) {
          prompt += `. ${descriptions.join('. ')}`;
        }
      }

      prompt += '. High quality, detailed artwork.';

      return await this.generateImage({ prompt, quality: 'high' });
    } catch (error) {
      logError('Error generating entity image with Vercel AI', error as Error, { action: 'generate_entity_image_vercel' });
      throw new Error(`Failed to generate entity image: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a world cover image based on world information
   */
  async generateWorldCoverImage({
    worldName,
    worldDescription,
    worldData,
    customPrompt
  }: {
    worldName: string;
    worldDescription?: string;
    worldData?: Pick<World, 'genreBlend' | 'overallTone' | 'keyThemes' | 'scopeScale' | 'aestheticDirection'>;
    customPrompt?: string;
  }): Promise<AIGenerationResult<GenerateImageResponse>> {
    try {
      let prompt = customPrompt || `Epic landscape artwork for "${worldName}"`;

      if (worldDescription) {
        prompt += `. ${worldDescription}`;
      }

      if (worldData) {
        if (worldData.genreBlend?.length) {
          prompt += ` in ${worldData.genreBlend.join('/')} style`;
        }
        if (worldData.overallTone) {
          prompt += ` with ${worldData.overallTone} atmosphere`;
        }
        if (worldData.scopeScale) {
          prompt += ` showing ${worldData.scopeScale} scale`;
        }
        if (worldData.aestheticDirection) {
          prompt += `. ${worldData.aestheticDirection}`;
        }
      }

      prompt += '. Cinematic, high quality, detailed environment art.';

      return await this.generateImage({
        prompt,
        quality: 'high',
      });
    } catch (error) {
      logError('Error generating world cover image with Vercel AI', error as Error, { action: 'generate_world_cover_image_vercel' });
      throw new Error(`Failed to generate world cover image: ${(error as Error).message}`);
    }
  }

  /**
   * Upload base64 image to Supabase Storage and return public URL
   */
  private async uploadImageToSupabase(base64Data: string, prompt: string): Promise<string> {
    try {
      const { adminClient } = await import('@/lib/supabase/admin');
      const supabase = adminClient;

      if (!supabase) {
        throw new Error('Supabase admin client not available');
      }

      // Convert base64 to blob
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `ai-generated-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      logError('Error uploading image to Supabase', error as Error, { action: 'upload_image_supabase' });
      throw new Error(`Failed to upload generated image: ${(error as Error).message}`);
    }
  }

  /**
   * Build world context string for prompts using all available world information
   * (Same implementation as original service)
   */
  private buildWorldContext(worldContext?: Pick<World, 'name' | 'description' | 'summary' | 'logline' | 'genreBlend' | 'overallTone' | 'keyThemes' | 'audienceRating' | 'scopeScale' | 'technologyLevel' | 'magicLevel' | 'cosmologyModel' | 'climateBiomes' | 'calendarTimekeeping' | 'societalOverview' | 'conflictDrivers' | 'rulesConstraints' | 'aestheticDirection'>): string {
    if (!worldContext) return '';

    let context = '';
    if (worldContext.name) context += `World: ${worldContext.name}\n`;
    if (worldContext.summary) context += `Summary: ${worldContext.summary}\n`;
    if (worldContext.description) context += `Description: ${worldContext.description}\n`;
    if (worldContext.logline) context += `Logline: ${worldContext.logline}\n`;
    if (worldContext.genreBlend?.length) context += `Genre: ${worldContext.genreBlend.join(', ')}\n`;
    if (worldContext.overallTone) {
      const tone = Array.isArray(worldContext.overallTone)
        ? worldContext.overallTone.join(', ')
        : worldContext.overallTone;
      context += `Tone: ${tone}\n`;
    }
    if (worldContext.keyThemes?.length) context += `Theme: ${worldContext.keyThemes.join(', ')}\n`;
    if (worldContext.audienceRating) context += `Audience Rating: ${worldContext.audienceRating}\n`;
    if (worldContext.scopeScale) context += `Scope & Scale: ${worldContext.scopeScale}\n`;
    if (worldContext.technologyLevel?.length) context += `Technology Level: ${worldContext.technologyLevel.join(', ')}\n`;
    if (worldContext.magicLevel?.length) context += `Magic Level: ${worldContext.magicLevel.join(', ')}\n`;
    if (worldContext.cosmologyModel) context += `Cosmology: ${worldContext.cosmologyModel}\n`;
    if (worldContext.climateBiomes?.length) context += `Travel Difficulty: ${worldContext.climateBiomes.join(', ')}\n`;
    if (worldContext.calendarTimekeeping) context += `Calendar & Timekeeping: ${worldContext.calendarTimekeeping}\n`;
    if (worldContext.societalOverview) context += `Societal Overview: ${worldContext.societalOverview}\n`;
    if (worldContext.conflictDrivers) {
      const drivers = Array.isArray(worldContext.conflictDrivers)
        ? worldContext.conflictDrivers.join(', ')
        : worldContext.conflictDrivers;
      context += `Conflict Drivers: ${drivers}\n`;
    }
    if (worldContext.rulesConstraints) context += `Rules & Constraints: ${worldContext.rulesConstraints}\n`;
    if (worldContext.aestheticDirection) context += `Aesthetic Direction: ${worldContext.aestheticDirection}\n`;

    return context ? `World Context:\n${context}\n` : '';
  }
}

export const aiServiceVercel = new AIServiceVercel();
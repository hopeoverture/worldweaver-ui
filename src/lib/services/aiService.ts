import OpenAI from 'openai';
import { TemplateField, FieldType, World, Entity, Template } from '@/lib/types';
import { logError } from '@/lib/logging';
import {
  calculateTextGenerationCost,
  calculateImageGenerationCost,
  type TokenUsage,
  type ImageGenerationParams
} from '@/lib/ai-pricing';

// Initialize OpenAI client lazily to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// =====================================================
// USAGE METRICS INTERFACES
// =====================================================

export interface AIUsageMetrics {
  // New schema fields
  operation: string; // Changed from operationType
  model?: string;
  provider?: string; // New field (openai, anthropic, etc.)
  requestId?: string; // New field for tracking provider requests
  promptTokens: number; // Changed from inputTokens
  completionTokens: number; // Changed from outputTokens
  totalTokens?: number; // Auto-calculated in DB
  costUsd: number; // Changed from estimatedCost
  currency: string; // New field
  success?: boolean; // Changed from status string
  errorCode?: string; // New field
  metadata: Record<string, unknown>; // Enhanced metadata
  startedAt?: Date; // New field
  finishedAt?: Date; // New field

  // Calculated fields for compatibility
  responseTimeMs?: number; // Calculated from startedAt/finishedAt
}

export interface AIGenerationResult<T> {
  result: T;
  usage: AIUsageMetrics;
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface GenerateTemplateRequest {
  prompt: string;
  worldContext?: Pick<World, 'name' | 'description' | 'logline' | 'genreBlend' | 'overallTone' | 'keyThemes' | 'audienceRating' | 'scopeScale' | 'technologyLevel' | 'magicLevel' | 'cosmologyModel' | 'climateBiomes' | 'calendarTimekeeping' | 'societalOverview' | 'conflictDrivers' | 'rulesConstraints' | 'aestheticDirection'>;
}

export interface GenerateTemplateResponse {
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: FieldType;
    prompt?: string;
    required?: boolean;
    options?: string[];
  }>;
}

export interface GenerateEntityFieldsRequest {
  prompt?: string;
  entityName?: string;
  templateName?: string;
  templateFields: TemplateField[];
  existingFields?: Record<string, unknown>;
  worldContext?: Pick<World, 'name' | 'description' | 'logline' | 'genreBlend' | 'overallTone' | 'keyThemes' | 'audienceRating' | 'scopeScale' | 'technologyLevel' | 'magicLevel' | 'cosmologyModel' | 'climateBiomes' | 'calendarTimekeeping' | 'societalOverview' | 'conflictDrivers' | 'rulesConstraints' | 'aestheticDirection'>;
  generateAllFields?: boolean;
  specificField?: string;
}

export interface GenerateEntityFieldsResponse {
  fields: Record<string, unknown>;
}

export interface GenerateWorldFieldsRequest {
  prompt?: string;
  fieldsToGenerate: string[];
  existingData?: Partial<{
    name: string;
    logline: string;
    genreBlend: string[];
    overallTone: string;
    keyThemes: string[];
    audienceRating: string;
    scopeScale: string;
    technologyLevel: string[];
    magicLevel: string[];
    cosmologyModel: string;
    climateBiomes: string[];
    calendarTimekeeping: string;
    societalOverview: string;
    conflictDrivers: string[];
    rulesConstraints: string;
    aestheticDirection: string;
  }>;
}

export interface GenerateWorldFieldsResponse {
  fields: Record<string, unknown>;
}

export interface GenerateImageRequest {
  prompt: string;
  quality?: 'low' | 'medium' | 'high';
}

export interface GenerateImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

export class AIService {

  /**
   * Generate a template from a user prompt with world context
   */
  async generateTemplate({ prompt, worldContext }: GenerateTemplateRequest): Promise<AIGenerationResult<GenerateTemplateResponse>> {
    const startTime = Date.now();

    try {
      const contextPrompt = this.buildWorldContext(worldContext);

      const systemPrompt = `You are a worldbuilding assistant. Generate a template for a tabletop RPG or creative writing project.

${contextPrompt}

Return a JSON object with this exact structure:
{
  "name": "Template Name",
  "description": "Brief description of what this template represents",
  "fields": [
    {
      "name": "Field Name",
      "type": "shortText|longText|richText|number|select|multiSelect|image|reference",
      "prompt": "AI generation prompt for this field (optional)",
      "required": true|false,
      "options": ["option1", "option2"] // only for select/multiSelect
    }
  ]
}

Include 3-8 relevant fields. Use appropriate field types. Always include a Name field as the first field.`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a template for: ${prompt}` }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response) as GenerateTemplateResponse;

      // Validate the response structure
      if (!parsed.name || !parsed.fields || !Array.isArray(parsed.fields)) {
        throw new Error('Invalid response format from OpenAI');
      }

      // Calculate usage metrics
      const usage = completion.usage;
      const responseTimeMs = Date.now() - startTime;

      const tokenUsage: TokenUsage = {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0
      };

      const costBreakdown = calculateTextGenerationCost('gpt-5-2025-08-07', tokenUsage);

      const endTime = new Date();

      return {
        result: parsed,
        usage: {
          operation: 'template',
          model: 'gpt-5-2025-08-07',
          provider: 'openai',
          requestId: completion.id,
          promptTokens: tokenUsage.inputTokens,
          completionTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costUsd: costBreakdown.totalCost,
          currency: 'USD',
          success: true,
          metadata: {
            worldContext: worldContext?.name || null,
            promptLength: prompt.length
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating template', error as Error, { action: 'generate_template' });
      throw new Error(`Failed to generate template: ${(error as Error).message}`);
    }
  }

  /**
   * Generate entity field values based on template and context
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
      const contextPrompt = this.buildWorldContext(worldContext);

      const fieldsToGenerate = generateAllFields
        ? templateFields
        : templateFields.filter(f => specificField ? f.name === specificField : !existingFields[f.name]);

      if (fieldsToGenerate.length === 0) {
        return {
          result: { fields: {} },
          usage: {
            operation: 'entity_fields',
            model: 'gpt-5-2025-08-07',
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

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);

      // Calculate usage metrics
      const usage = completion.usage;
      const responseTimeMs = Date.now() - startTime;

      const tokenUsage: TokenUsage = {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0
      };

      const costBreakdown = calculateTextGenerationCost('gpt-5-2025-08-07', tokenUsage);

      const endTime = new Date();

      return {
        result: { fields: parsed },
        usage: {
          operation: 'entity_fields',
          model: 'gpt-5-2025-08-07',
          provider: 'openai',
          requestId: completion.id,
          promptTokens: tokenUsage.inputTokens,
          completionTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costUsd: costBreakdown.totalCost,
          currency: 'USD',
          success: true,
          metadata: {
            entityName: entityName || null,
            templateName: templateName || null,
            fieldsGenerated: Object.keys(parsed).length,
            worldContext: worldContext?.name || null
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating entity fields', error as Error, {
        action: 'generate_entity_fields'
      });
      throw new Error(`Failed to generate entity fields: ${(error as Error).message}`);
    }
  }

  /**
   * Generate an image using GPT-image-1
   */
  async generateImage({
    prompt,
    quality = 'medium'
  }: GenerateImageRequest): Promise<AIGenerationResult<GenerateImageResponse>> {
    const startTime = Date.now();

    try {
      // Map quality to size for the API
      const sizeMap = {
        low: '1024x1024',
        medium: '1024x1024',
        high: '1024x1024'
      } as const;

      // Use proper OpenAI Images API
      const response = await getOpenAIClient().images.generate({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: sizeMap[quality],
        quality: quality === 'high' ? 'hd' : 'standard',
        response_format: 'url'
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from GPT-image-1');
      }

      const imageData = response.data[0];
      if (!imageData?.url) {
        throw new Error('No image URL returned from GPT-image-1');
      }

      // Calculate usage metrics for image generation
      const responseTimeMs = Date.now() - startTime;
      const costBreakdown = calculateImageGenerationCost({ quality });

      const endTime = new Date();

      return {
        result: {
          imageUrl: imageData.url,
          revisedPrompt: imageData.revised_prompt || prompt
        },
        usage: {
          operation: 'image',
          model: 'gpt-image-1',
          provider: 'openai',
          requestId: response.created?.toString(),
          promptTokens: 0, // Image generation doesn't use tokens in the same way
          completionTokens: 0,
          totalTokens: 0,
          costUsd: costBreakdown.imageCost,
          currency: 'USD',
          success: true,
          metadata: {
            imageQuality: quality,
            size: sizeMap[quality],
            revisedPrompt: imageData.revised_prompt || prompt
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating image', error as Error, {
        action: 'generate_image'
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
      logError('Error generating entity image', error as Error, { action: 'generate_entity_image' });
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
      logError('Error generating world cover image', error as Error, { action: 'generate_world_cover_image' });
      throw new Error(`Failed to generate world cover image: ${(error as Error).message}`);
    }
  }

  /**
   * Generate world field values based on existing data and context
   */
  async generateWorldFields({
    prompt,
    fieldsToGenerate,
    existingData = {}
  }: GenerateWorldFieldsRequest): Promise<AIGenerationResult<GenerateWorldFieldsResponse>> {
    const startTime = Date.now();

    try {
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

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);

      // Calculate usage metrics
      const usage = completion.usage;
      const responseTimeMs = Date.now() - startTime;

      const tokenUsage: TokenUsage = {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0
      };

      const costBreakdown = calculateTextGenerationCost('gpt-5-2025-08-07', tokenUsage);

      const endTime = new Date();

      return {
        result: { fields: parsed },
        usage: {
          operation: 'world_fields',
          model: 'gpt-5-2025-08-07',
          provider: 'openai',
          requestId: completion.id,
          promptTokens: tokenUsage.inputTokens,
          completionTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costUsd: costBreakdown.totalCost,
          currency: 'USD',
          success: true,
          metadata: {
            fieldsToGenerate: fieldsToGenerate,
            fieldsGenerated: Object.keys(parsed).length,
            hasExistingData: Object.keys(existingData || {}).length > 0
          },
          startedAt: new Date(startTime),
          finishedAt: endTime,
          responseTimeMs
        }
      };
    } catch (error) {
      logError('Error generating world fields', error as Error, {
        action: 'generate_world_fields'
      });
      throw new Error(`Failed to generate world fields: ${(error as Error).message}`);
    }
  }

  /**
   * Build world context string for prompts using all available world information
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

export const aiService = new AIService();
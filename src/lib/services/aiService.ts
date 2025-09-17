import OpenAI from 'openai';
import { TemplateField, FieldType, World, Entity, Template } from '@/lib/types';
import { logError } from '@/lib/logging';
import { ArtStyle, buildImagePrompt } from '@/lib/artStyles';
import {
  calculateTextGenerationCost,
  calculateImageGenerationCost,
  type TokenUsage,
  type ImageGenerationParams
} from '@/lib/ai-pricing';
import { aiContextCache } from '@/lib/cache/aiContextCache';
import { getOpenAIApiKey, validateOpenAIApiKey } from '@/lib/config/environment';

// Initialize OpenAI client lazily to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Validate the API key format
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

    console.log('🔑 Using API key from secure env ending with:', apiKey.slice(-10));
    openai = new OpenAI({
      apiKey: apiKey,
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

export interface GenerateEntitySummaryRequest {
  entity: Entity;
  template: Template;
  worldContext?: Pick<World, 'name' | 'description' | 'logline' | 'genreBlend' | 'overallTone' | 'keyThemes' | 'audienceRating' | 'scopeScale' | 'technologyLevel' | 'magicLevel' | 'cosmologyModel' | 'climateBiomes' | 'calendarTimekeeping' | 'societalOverview' | 'conflictDrivers' | 'rulesConstraints' | 'aestheticDirection'>;
  customPrompt?: string;
}

export interface GenerateEntitySummaryResponse {
  summary: string;
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
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a template for: ${prompt}` }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 2000 // High limit to account for GPT-5-mini reasoning tokens
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

      const costBreakdown = calculateTextGenerationCost('gpt-5-mini', tokenUsage);

      const endTime = new Date();

      return {
        result: parsed,
        usage: {
          operation: 'template',
          model: 'gpt-5-mini',
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

      // Check if AI context fields are filled to provide better context
      const aiContextFields = templateFields.filter(f => f.requireForAIContext);
      const filledAIContextFields = aiContextFields.filter(f => existingFields[f.id] || existingFields[f.name]);
      const hasRequiredFieldContext = filledAIContextFields.length === aiContextFields.length;

      const fieldsToGenerate = generateAllFields
        ? templateFields
        : templateFields.filter(f => specificField ? f.name === specificField : !existingFields[f.name]);

      console.log('🔍 AI Entity Fields Generation Debug:', {
        templateName,
        totalTemplateFields: templateFields.length,
        fieldsToGenerateCount: fieldsToGenerate.length,
        generateAllFields,
        specificField,
        templateFieldNames: templateFields.map(f => f.name),
        fieldsToGenerateNames: fieldsToGenerate.map(f => f.name),
        existingFieldKeys: Object.keys(existingFields)
      });

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

${hasRequiredFieldContext
  ? 'ℹ️ All AI context fields are filled, providing good context for generation.'
  : aiContextFields.length > 0
    ? '⚠️ Some AI context fields are missing. Generate content that works generally but may lack specific context.'
    : 'ℹ️ No AI context fields are defined for this template.'
}

Existing fields:
${Object.entries(existingFields).map(([key, value]) => `${key}: ${value}`).join('\n')}

Generate values for these fields:
${fieldsToGenerate.map(f => `- ${f.name} (${f.type})${f.prompt ? `: ${f.prompt}` : ''}`).join('\n')}

CRITICAL FORMATTING REQUIREMENTS:
1. Return a JSON object with EXACT field names as keys and generated values as values
2. DO NOT include type information like (shortText), (longText), (select), etc. in your field names
3. DO NOT add extra annotations like (3-5), (optional), etc. to field names
4. Use the EXACT field names shown above, stripping only the type information in parentheses

For text fields, provide appropriate strings.
For number fields, provide numbers.
For select fields, choose from valid options if provided.
For multiSelect fields, provide arrays of strings.

CORRECT example format:
{
  "Character Name": "Zara Nightwhisper",
  "Age & Appearance Snapshot": "Mid-20s, tall and lean with silver hair",
  "Personality Traits": ["Curious", "Loyal", "Impulsive"],
  "Role / Archetype": "Ally"
}

INCORRECT examples (DO NOT DO THIS):
{
  "Character Name (shortText)": "...",
  "Personality Traits (3-5) (multiSelect)": [...],
  "Age & Appearance Snapshot (shortText)": "..."
}`;

      const userPrompt = prompt
        ? `Additional context: ${prompt}\n\nGenerate the field values.`
        : 'Generate appropriate field values based on the context.';

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(response);

      console.log('🔍 AI Response Debug:', {
        rawResponse: response,
        parsedFields: Object.keys(parsed),
        parsedData: parsed
      });

      // Map field names to field IDs for UI compatibility
      // The AI returns fields by name, but the UI expects them by field ID
      const fieldNameToIdMap = new Map<string, string>();
      fieldsToGenerate.forEach(field => {
        fieldNameToIdMap.set(field.name, field.id);
        // Also map normalized versions for better matching
        fieldNameToIdMap.set(field.name.toLowerCase().trim(), field.id);
      });

      const mappedFields: Record<string, unknown> = {};
      Object.entries(parsed).forEach(([aiFieldName, value]) => {
        // Multiple cleaning strategies for AI field names
        let cleanFieldName = aiFieldName;

        // 1. Remove type annotations in parentheses: "(shortText)", "(longText)", etc.
        cleanFieldName = cleanFieldName.replace(/\s*\([^)]*\)\s*$/g, '').trim();

        // 2. Remove extra annotations like "(3–5)", "(optional)", etc.
        cleanFieldName = cleanFieldName.replace(/\s*\([^)]*\)\s*$/g, '').trim();

        // 3. Remove multiple parenthetical annotations if any remain
        cleanFieldName = cleanFieldName.replace(/\s*\([^)]*\).*$/g, '').trim();

        // 4. Normalize spacing around common separators
        cleanFieldName = cleanFieldName.replace(/\s*\/\s*/g, ' / ');
        cleanFieldName = cleanFieldName.replace(/\s*&\s*/g, ' & ');

        console.log(`🔍 Cleaning AI field: "${aiFieldName}" -> "${cleanFieldName}"`);

        // Try multiple matching strategies
        let fieldId = fieldNameToIdMap.get(aiFieldName) ||  // Exact match with original
                     fieldNameToIdMap.get(cleanFieldName) ||  // Clean match
                     fieldNameToIdMap.get(cleanFieldName.toLowerCase().trim()); // Normalized match

        // If no direct match, try case-insensitive exact match
        if (!fieldId) {
          for (const [templateFieldName, templateFieldId] of fieldNameToIdMap.entries()) {
            if (templateFieldName.toLowerCase() === cleanFieldName.toLowerCase()) {
              fieldId = templateFieldId;
              console.log(`🔄 Case-insensitive matched AI field "${aiFieldName}" -> template field "${templateFieldName}"`);
              break;
            }
          }
        }

        // If still no match, try fuzzy matching
        if (!fieldId) {
          for (const [templateFieldName, templateFieldId] of fieldNameToIdMap.entries()) {
            const templateLower = templateFieldName.toLowerCase();
            const cleanLower = cleanFieldName.toLowerCase();

            // Check if one contains the other, or if they share significant word overlap
            if (templateLower.includes(cleanLower) ||
                cleanLower.includes(templateLower) ||
                this.calculateSimilarity(templateLower, cleanLower) > 0.8) {
              fieldId = templateFieldId;
              console.log(`🔄 Fuzzy matched AI field "${aiFieldName}" -> template field "${templateFieldName}"`);
              break;
            }
          }
        }

        if (fieldId) {
          mappedFields[fieldId] = value;
          console.log(`✅ Mapped AI field "${aiFieldName}" -> field ID "${fieldId}"`);
        } else {
          // Log unmapped fields for debugging
          console.warn(`❌ AI generated field "${aiFieldName}" (cleaned: "${cleanFieldName}") not found in template fields:`,
            Array.from(fieldNameToIdMap.keys()));
        }
      });

      console.log('🔍 Final Mapping Result:', {
        aiGeneratedFieldCount: Object.keys(parsed).length,
        successfullyMappedCount: Object.keys(mappedFields).length,
        mappedFieldIds: Object.keys(mappedFields),
        unmappedAIFields: Object.keys(parsed).filter(aiField => {
          const cleanFieldName = aiField.replace(/\s*\([^)]*\).*$/, '').trim();
          return !fieldNameToIdMap.has(aiField) &&
                 !fieldNameToIdMap.has(cleanFieldName) &&
                 !fieldNameToIdMap.has(cleanFieldName.toLowerCase().trim());
        })
      });

      // Calculate usage metrics
      const usage = completion.usage;
      const responseTimeMs = Date.now() - startTime;

      const tokenUsage: TokenUsage = {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0
      };

      const costBreakdown = calculateTextGenerationCost('gpt-5-mini', tokenUsage);

      const endTime = new Date();

      return {
        result: { fields: mappedFields },
        usage: {
          operation: 'entity_fields',
          model: 'gpt-5-mini',
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
            fieldsGenerated: Object.keys(mappedFields).length,
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
   * Generate a comprehensive summary for an entity that synthesizes all field data
   */
  async generateEntitySummary({
    entity,
    template,
    worldContext,
    customPrompt
  }: GenerateEntitySummaryRequest): Promise<AIGenerationResult<GenerateEntitySummaryResponse>> {
    const startTime = Date.now();

    try {
      const contextPrompt = this.buildWorldContext(worldContext);

      // Build field context from entity data
      const fieldDescriptions: string[] = [];
      template.fields.forEach(field => {
        const value = entity.fields[field.id] || entity.fields[field.name];
        if (value !== undefined && value !== null && value !== '') {
          // Format the value based on field type
          let formattedValue = '';
          if (Array.isArray(value)) {
            formattedValue = value.join(', ');
          } else if (typeof value === 'object') {
            formattedValue = JSON.stringify(value);
          } else {
            formattedValue = String(value);
          }
          fieldDescriptions.push(`${field.name}: ${formattedValue}`);
        }
      });

      const entityContext = fieldDescriptions.length > 0
        ? `\nEntity Details:\n${fieldDescriptions.join('\n')}`
        : '\nNo additional entity details provided.';

      const systemPrompt = `You are a worldbuilding assistant specializing in creating compelling narrative summaries.

${contextPrompt}

Your task is to create a comprehensive, engaging summary for this ${template.name.toLowerCase()} named "${entity.name}".

Guidelines:
- Write in 2-3 well-structured paragraphs
- Weave together all provided details into a coherent narrative
- Match the tone and style of the world setting
- Focus on what makes this ${template.name.toLowerCase()} unique and interesting
- Write in third person
- Avoid simply listing facts - create flowing, engaging prose
- Include relationships and connections where relevant
${customPrompt ? `\nSpecial instructions: ${customPrompt}` : ''}

Return only the summary text, no additional formatting or metadata.`;

      const userPrompt = `Create a compelling summary for this ${template.name.toLowerCase()}:

Name: ${entity.name}
Type: ${template.name}${entityContext}`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000 // Very high limit to account for GPT-5-mini reasoning tokens
      });

      console.log('📝 Summary API Response Debug:', {
        hasCompletion: !!completion,
        hasChoices: !!completion.choices,
        choicesLength: completion.choices?.length || 0,
        firstChoice: completion.choices?.[0] ? {
          hasMessage: !!completion.choices[0].message,
          messageKeys: Object.keys(completion.choices[0].message || {}),
          hasContent: !!completion.choices[0].message?.content,
          contentLength: completion.choices[0].message?.content?.length || 0,
          finishReason: completion.choices[0].finish_reason
        } : 'none',
        fullCompletion: JSON.stringify(completion, null, 2)
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const endTime = Date.now();
      const tokens = completion.usage;

      const usage: AIUsageMetrics = {
        operation: 'entity-summary',
        model: 'gpt-5-mini',
        provider: 'openai',
        promptTokens: tokens?.prompt_tokens || 0,
        completionTokens: tokens?.completion_tokens || 0,
        totalTokens: tokens?.total_tokens || 0,
        costUsd: calculateTextGenerationCost('gpt-5-mini', {
          inputTokens: tokens?.prompt_tokens || 0,
          outputTokens: tokens?.completion_tokens || 0,
          totalTokens: tokens?.total_tokens || 0
        }).totalCost,
        currency: 'USD',
        success: true,
        metadata: {
          entityId: entity.id,
          entityName: entity.name,
          templateName: template.name,
          worldId: entity.worldId,
          fieldCount: fieldDescriptions.length,
          hasCustomPrompt: !!customPrompt
        },
        responseTimeMs: endTime - startTime
      };

      return {
        result: { summary: response.trim() },
        usage
      };
    } catch (error) {
      logError('Error generating entity summary', error as Error, {
        action: 'generate_entity_summary'
      });
      throw new Error(`Failed to generate entity summary: ${(error as Error).message}`);
    }
  }

  /**
   * Generate an image using GPT-image-1
   */
  async generateImage({
    prompt,
    quality = 'medium',
    artStyle
  }: GenerateImageRequest & { artStyle?: ArtStyle }): Promise<AIGenerationResult<GenerateImageResponse>> {
    const startTime = Date.now();

    try {
      // Map quality to size for the API
      const sizeMap = {
        low: '1024x1024',
        medium: '1024x1024',
        high: '1024x1024'
      } as const;

      // Build the final prompt with art style
      const finalPrompt = buildImagePrompt(prompt, artStyle);

      // Use proper OpenAI Images API
      const response = await getOpenAIClient().images.generate({
        model: 'gpt-image-1',
        prompt: finalPrompt,
        n: 1,
        size: sizeMap[quality],
        quality: quality === 'high' ? 'high' : 'standard'
      });

      console.log('🖼️ Image API Response Debug:', {
        hasData: !!response.data,
        dataLength: response.data?.length || 0,
        responseKeys: Object.keys(response),
        dataStructure: response.data?.[0] ? Object.keys(response.data[0]) : 'none',
        fullResponse: JSON.stringify(response, null, 2)
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from GPT-image-1');
      }

      const imageData = response.data[0];
      console.log('🖼️ Image Data Debug:', {
        hasUrl: !!imageData?.url,
        hasB64Json: !!imageData?.b64_json,
        imageDataKeys: Object.keys(imageData || {}),
        imageData: JSON.stringify(imageData, null, 2)
      });

      // GPT-image-1 might return base64 data instead of URL
      const imageUrl = imageData?.url || (imageData?.b64_json ? `data:image/png;base64,${imageData.b64_json}` : null);

      if (!imageUrl) {
        throw new Error('No image URL or base64 data returned from GPT-image-1');
      }

      // Calculate usage metrics for image generation
      const responseTimeMs = Date.now() - startTime;
      const costBreakdown = calculateImageGenerationCost({ quality });

      const endTime = new Date();

      return {
        result: {
          imageUrl,
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
            revisedPrompt: imageData.revised_prompt || finalPrompt,
            originalPrompt: prompt,
            artStyle: artStyle ? {
              id: artStyle.id,
              name: artStyle.name,
              isBuiltIn: artStyle.isBuiltIn
            } : null
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
    customPrompt,
    artStyle
  }: {
    entityName: string;
    templateName?: string;
    entityFields?: Record<string, unknown>;
    worldContext?: Pick<World, 'name' | 'description' | 'genreBlend' | 'overallTone' | 'keyThemes'>;
    customPrompt?: string;
    artStyle?: ArtStyle;
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

      return await this.generateImage({ prompt, quality: 'high', artStyle });
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
    customPrompt,
    artStyle
  }: {
    worldName: string;
    worldDescription?: string;
    worldData?: Pick<World, 'genreBlend' | 'overallTone' | 'keyThemes' | 'scopeScale' | 'aestheticDirection'>;
    customPrompt?: string;
    artStyle?: ArtStyle;
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

      return await this.generateImage({
        prompt,
        quality: 'high',
        artStyle
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
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
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

      const costBreakdown = calculateTextGenerationCost('gpt-5-mini', tokenUsage);

      const endTime = new Date();

      return {
        result: { fields: parsed },
        usage: {
          operation: 'world_fields',
          model: 'gpt-5-mini',
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
    // Use cached context building to reduce repeated processing
    return aiContextCache.getWorldContext(worldContext);
  }

  /**
   * Calculate similarity between two strings using a simple word-based approach
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);

    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }
}

export const aiService = new AIService();
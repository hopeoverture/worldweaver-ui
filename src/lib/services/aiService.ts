import OpenAI from 'openai';
import { TemplateField, FieldType, World, Entity, Template } from '@/lib/types';
import { logError } from '@/lib/logging';

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
  style?: 'natural' | 'vivid';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
}

export interface GenerateImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

export class AIService {

  /**
   * Generate a template from a user prompt with world context
   */
  async generateTemplate({ prompt, worldContext }: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
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
        model: 'gpt-4o-mini',
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

      return parsed;
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
  }: GenerateEntityFieldsRequest): Promise<GenerateEntityFieldsResponse> {
    try {
      const contextPrompt = this.buildWorldContext(worldContext);

      const fieldsToGenerate = generateAllFields
        ? templateFields
        : templateFields.filter(f => specificField ? f.name === specificField : !existingFields[f.name]);

      if (fieldsToGenerate.length === 0) {
        return { fields: {} };
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
        model: 'gpt-4o-mini',
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

      return { fields: parsed };
    } catch (error) {
      logError('Error generating entity fields', error as Error, {
        action: 'generate_entity_fields'
      });
      throw new Error(`Failed to generate entity fields: ${(error as Error).message}`);
    }
  }

  /**
   * Generate an image using DALL-E
   */
  async generateImage({
    prompt,
    style = 'natural',
    size = '1024x1024',
    quality = 'standard'
  }: GenerateImageRequest): Promise<GenerateImageResponse> {
    try {
      const response = await getOpenAIClient().images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        style,
        response_format: 'url'
      });

      const imageData = response.data?.[0];
      if (!imageData?.url) {
        throw new Error('No image URL in response');
      }

      return {
        imageUrl: imageData.url,
        revisedPrompt: imageData.revised_prompt
      };
    } catch (error) {
      logError('Error generating image', error as Error, { action: 'generate_image' });
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
  }): Promise<GenerateImageResponse> {
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

      return await this.generateImage({ prompt, quality: 'hd' });
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
  }): Promise<GenerateImageResponse> {
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
        quality: 'hd',
        size: '1792x1024' // Landscape format for world covers
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
  }: GenerateWorldFieldsRequest): Promise<GenerateWorldFieldsResponse> {
    try {
      const contextPrompt = this.buildWorldContext(existingData as any);

      // Build field descriptions for the AI
      const fieldDescriptions: Record<string, string> = {
        name: 'A creative and memorable name for the world',
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
        model: 'gpt-4o-mini',
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

      return { fields: parsed };
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
  private buildWorldContext(worldContext?: Pick<World, 'name' | 'description' | 'logline' | 'genreBlend' | 'overallTone' | 'keyThemes' | 'audienceRating' | 'scopeScale' | 'technologyLevel' | 'magicLevel' | 'cosmologyModel' | 'climateBiomes' | 'calendarTimekeeping' | 'societalOverview' | 'conflictDrivers' | 'rulesConstraints' | 'aestheticDirection'>): string {
    if (!worldContext) return '';

    let context = '';
    if (worldContext.name) context += `World: ${worldContext.name}\n`;
    if (worldContext.description) context += `Description: ${worldContext.description}\n`;
    if (worldContext.logline) context += `Logline: ${worldContext.logline}\n`;
    if (worldContext.genreBlend?.length) context += `Genre: ${worldContext.genreBlend.join(', ')}\n`;
    if (worldContext.overallTone) context += `Tone: ${worldContext.overallTone}\n`;
    if (worldContext.keyThemes?.length) context += `Key Themes: ${worldContext.keyThemes.join(', ')}\n`;
    if (worldContext.audienceRating) context += `Audience Rating: ${worldContext.audienceRating}\n`;
    if (worldContext.scopeScale) context += `Scope & Scale: ${worldContext.scopeScale}\n`;
    if (worldContext.technologyLevel?.length) context += `Technology Level: ${worldContext.technologyLevel.join(', ')}\n`;
    if (worldContext.magicLevel?.length) context += `Magic Level: ${worldContext.magicLevel.join(', ')}\n`;
    if (worldContext.cosmologyModel) context += `Cosmology: ${worldContext.cosmologyModel}\n`;
    if (worldContext.climateBiomes?.length) context += `Climate & Biomes: ${worldContext.climateBiomes.join(', ')}\n`;
    if (worldContext.calendarTimekeeping) context += `Calendar & Timekeeping: ${worldContext.calendarTimekeeping}\n`;
    if (worldContext.societalOverview) context += `Societal Overview: ${worldContext.societalOverview}\n`;
    if (worldContext.conflictDrivers) context += `Conflict Drivers: ${worldContext.conflictDrivers}\n`;
    if (worldContext.rulesConstraints) context += `Rules & Constraints: ${worldContext.rulesConstraints}\n`;
    if (worldContext.aestheticDirection) context += `Aesthetic Direction: ${worldContext.aestheticDirection}\n`;

    return context ? `World Context:\n${context}\n` : '';
  }
}

export const aiService = new AIService();
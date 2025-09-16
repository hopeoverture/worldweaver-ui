/**
 * AI Pricing and Cost Calculation Utilities
 *
 * This module contains up-to-date pricing information for AI services
 * and utilities to calculate costs based on usage metrics.
 *
 * Pricing is based on OpenAI's current rates (as of September 2025)
 * and should be updated when pricing changes.
 */

// =====================================================
// PRICING CONSTANTS
// =====================================================

/**
 * OpenAI pricing structure
 * All prices are per unit (token or image)
 */
export const AI_PRICING = {
  // GPT-5 pricing (per token)
  'gpt-5-2025-08-07': {
    input: 0.25 / 1_000_000,     // $0.25 per 1M input tokens
    cached_input: 0.025 / 1_000_000,  // $0.025 per 1M cached input tokens
    output: 2.00 / 1_000_000,    // $2.00 per 1M output tokens
  },

  // GPT-5-mini pricing (per token) - Custom model from user
  'gpt-5-mini': {
    input: 0.15 / 1_000_000,     // Estimated pricing for mini variant
    cached_input: 0.015 / 1_000_000,  // Estimated cached pricing
    output: 0.75 / 1_000_000,    // Estimated output pricing
  },

  // GPT-image-1 pricing (per token for multimodal)
  'gpt-image-1': {
    text_input: 5.00 / 1_000_000,      // $5.00 per 1M text input tokens
    text_cached_input: 1.25 / 1_000_000,  // $1.25 per 1M cached text input tokens
    image_input: 10.00 / 1_000_000,    // $10.00 per 1M image input tokens
    image_cached_input: 2.50 / 1_000_000,  // $2.50 per 1M cached image input tokens
    image_output: 40.00 / 1_000_000,   // $40.00 per 1M image output tokens

    // Square image generation costs (approximate)
    square_images: {
      low: 0.01,      // $0.01 per low quality image
      medium: 0.04,   // $0.04 per medium quality image
      high: 0.17      // $0.17 per high quality image
    }
  }
} as const;

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ImageGenerationParams {
  quality: 'low' | 'medium' | 'high';
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
  currency: 'USD';
}

export interface ImageCostBreakdown {
  imageCost: number;
  model: string;
  size: string;
  quality: string;
  currency: 'USD';
}

// =====================================================
// TEXT GENERATION COST FUNCTIONS
// =====================================================

/**
 * Calculate cost for text generation based on token usage
 */
export function calculateTextGenerationCost(
  model: keyof typeof AI_PRICING,
  usage: TokenUsage,
  useCachedPricing: boolean = false
): CostBreakdown {
  if (model === 'gpt-image-1') {
    throw new Error('Use calculateImageGenerationCost for image models');
  }

  const pricing = AI_PRICING[model];
  if (!pricing || typeof pricing === 'object' && !('input' in pricing)) {
    throw new Error(`Unsupported text model: ${model}`);
  }

  // Use cached pricing if available and requested
  const inputRate = useCachedPricing && 'cached_input' in pricing
    ? (pricing as any).cached_input
    : (pricing as any).input;

  const inputCost = usage.inputTokens * inputRate;
  const outputCost = usage.outputTokens * (pricing as any).output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost: Math.round(inputCost * 1_000_000) / 1_000_000, // Round to 6 decimal places
    outputCost: Math.round(outputCost * 1_000_000) / 1_000_000,
    totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
    model,
    currency: 'USD'
  };
}

/**
 * Calculate cost for a single text generation request
 * Returns just the total cost as a number
 */
export function calculateTextCost(
  model: keyof typeof AI_PRICING,
  inputTokens: number,
  outputTokens: number
): number {
  const breakdown = calculateTextGenerationCost(model, {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens
  });
  return breakdown.totalCost;
}

// =====================================================
// IMAGE GENERATION COST FUNCTIONS
// =====================================================

/**
 * Calculate cost for image generation with GPT-image-1
 */
export function calculateImageGenerationCost(
  params: { quality: 'low' | 'medium' | 'high' }
): ImageCostBreakdown {
  const pricing = AI_PRICING['gpt-image-1'];
  const imageCost = pricing.square_images[params.quality];

  if (imageCost === undefined) {
    throw new Error(`Unsupported image quality: ${params.quality}`);
  }

  return {
    imageCost,
    model: 'gpt-image-1',
    size: 'square', // GPT-image-1 uses quality levels instead of specific sizes
    quality: params.quality,
    currency: 'USD'
  };
}

/**
 * Calculate cost for a single image generation request
 * Returns just the cost as a number
 */
export function calculateImageCost(
  quality: ImageGenerationParams['quality']
): number {
  const breakdown = calculateImageGenerationCost({ quality });
  return breakdown.imageCost;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Estimate cost for a text prompt before generation
 * This is approximate as we don't know exact output tokens
 */
export function estimateTextCost(
  model: keyof typeof AI_PRICING,
  promptText: string,
  estimatedOutputTokens: number = 100
): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  const estimatedInputTokens = Math.ceil(promptText.length / 4);

  return calculateTextCost(model, estimatedInputTokens, estimatedOutputTokens);
}

/**
 * Get the pricing information for display purposes
 */
export function getPricingInfo() {
  return {
    textGeneration: {
      model: 'gpt-5-mini',
      inputPricePerToken: AI_PRICING['gpt-5-mini'].input,
      cachedInputPricePerToken: AI_PRICING['gpt-5-mini'].cached_input,
      outputPricePerToken: AI_PRICING['gpt-5-mini'].output,
      inputPricePer1M: AI_PRICING['gpt-5-mini'].input * 1_000_000,
      cachedInputPricePer1M: AI_PRICING['gpt-5-mini'].cached_input * 1_000_000,
      outputPricePer1M: AI_PRICING['gpt-5-mini'].output * 1_000_000,
    },
    imageGeneration: {
      model: 'gpt-image-1',
      pricing: AI_PRICING['gpt-image-1']
    },
    currency: 'USD'
  };
}

/**
 * Format cost for display (rounds to appropriate decimal places)
 */
export function formatCost(cost: number, currency: string = 'USD'): string {
  if (cost === 0) return '$0.00';

  // For very small amounts, show more decimal places
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  }

  // For larger amounts, use standard currency formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(cost);
}

/**
 * Calculate total cost for multiple operations
 */
export function calculateBatchCost(costs: number[]): number {
  const total = costs.reduce((sum, cost) => sum + cost, 0);
  return Math.round(total * 1_000_000) / 1_000_000; // Round to 6 decimal places
}

// =====================================================
// QUOTA AND BUDGET UTILITIES
// =====================================================

/**
 * Check if a cost would exceed a budget
 */
export function wouldExceedBudget(
  currentSpent: number,
  additionalCost: number,
  budget: number
): boolean {
  return (currentSpent + additionalCost) > budget;
}

/**
 * Calculate remaining budget
 */
export function calculateRemainingBudget(
  currentSpent: number,
  budget: number
): number {
  return Math.max(0, budget - currentSpent);
}

/**
 * Calculate percentage of budget used
 */
export function calculateBudgetUsagePercentage(
  currentSpent: number,
  budget: number
): number {
  if (budget <= 0) return 100;
  return Math.min(100, (currentSpent / budget) * 100);
}

// =====================================================
// EXPORTS
// =====================================================

// Default export with all functions
export default {
  calculateTextGenerationCost,
  calculateTextCost,
  calculateImageGenerationCost,
  calculateImageCost,
  estimateTextCost,
  getPricingInfo,
  formatCost,
  calculateBatchCost,
  wouldExceedBudget,
  calculateRemainingBudget,
  calculateBudgetUsagePercentage,
  AI_PRICING
};
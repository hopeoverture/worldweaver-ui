/**
 * AI Usage Tracking Service
 *
 * This service handles tracking AI usage, managing quotas, and providing
 * usage statistics for billing and analytics purposes.
 *
 * Updated for new schema with ai_usage and ai_quotas tables.
 */

import { adminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/browser';
import { logError } from '@/lib/logging';
import type { AIUsageMetrics } from './aiService';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface AIUsageTrackingRequest {
  userId: string;
  usage: AIUsageMetrics;
  error?: string;
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  operationBreakdown: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

export interface QuotaInfo {
  tokensRemaining: number;
  tokensQuota: number;
  costRemaining: number;
  costQuota: number;
  periodStart: Date;
  periodEnd: Date;
  isOverQuota: boolean;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
}

// =====================================================
// AI USAGE SERVICE CLASS
// =====================================================

export class AIUsageService {
  private supabase = adminClient;

  /**
   * Get current user ID from auth context
   */
  private async getCurrentUserId(): Promise<string> {
    const browserClient = createClient();
    const { data: { user }, error } = await browserClient.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  /**
   * Track AI usage for a user
   */
  async trackUsage({
    userId,
    usage,
    error
  }: AIUsageTrackingRequest): Promise<void> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase admin client not available');
      }

      // Prepare usage data for the new schema
      const usageData = {
        user_id: userId,
        operation: usage.operation,
        model: usage.model || null,
        provider: usage.provider || 'openai',
        request_id: usage.requestId || null,
        prompt_tokens: usage.promptTokens,
        completion_tokens: usage.completionTokens,
        cost_usd: usage.costUsd,
        currency: usage.currency || 'USD',
        success: usage.success ?? null,
        error_code: error || usage.errorCode || null,
        metadata: (usage.metadata || {}) as any,
        started_at: usage.startedAt?.toISOString() || null,
        finished_at: usage.finishedAt?.toISOString() || null
      };

      // Insert usage record
      const { error: insertError } = await this.supabase
        .from('ai_usage')
        .insert(usageData);

      if (insertError) {
        throw insertError;
      }

      // Update quota usage if successful
      if (usage.success) {
        await this.updateQuotaUsage(userId, usage.promptTokens + usage.completionTokens, usage.costUsd);
      }

    } catch (error) {
      logError('Error tracking AI usage', error as Error, {
        action: 'track_ai_usage',
        userId,
        operationType: usage.operation
      });
      // Don't re-throw to avoid breaking the main AI operation
    }
  }

  /**
   * Check if user has remaining quota for the current period
   */
  async checkQuota(
    userId: string,
    tokensRequested: number = 0,
    costRequested: number = 0
  ): Promise<boolean> {
    try {
      if (!this.supabase) {
        return true; // Allow if client not available
      }

      const quotaInfo = await this.getQuotaInfo(userId);

      // Check if within quota limits
      const hasTokenQuota = quotaInfo.tokensQuota === null ||
        (quotaInfo.tokensRemaining >= tokensRequested);

      const hasCostQuota = quotaInfo.costQuota === null ||
        (quotaInfo.costRemaining >= costRequested);

      return hasTokenQuota && hasCostQuota;
    } catch (error) {
      logError('Error checking AI quota', error as Error, {
        action: 'check_ai_quota',
        userId
      });
      // Default to allowing if quota check fails
      return true;
    }
  }

  /**
   * Get user's current quota information
   */
  async getQuotaInfo(userId?: string): Promise<QuotaInfo> {
    try {
      const uid = userId || await this.getCurrentUserId();
      if (!this.supabase) {
        throw new Error('Supabase admin client not available');
      }

      // Get current period quota
      const now = new Date();
      const { data: quota, error: quotaError } = await this.supabase
        .from('ai_quotas')
        .select('*')
        .eq('user_id', uid)
        .lte('period_start', now.toISOString())
        .gte('period_end', now.toISOString())
        .single();

      // If no quota found, create a default monthly quota
      if (quotaError || !quota) {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const defaultQuota = {
          user_id: uid,
          period_start: monthStart.toISOString(),
          period_end: monthEnd.toISOString(),
          token_limit: 100000, // 100k tokens per month
          usd_limit: 10.0, // $10 per month
          used_tokens: 0,
          used_usd: 0,
          metadata: { type: 'monthly', created_by: 'system' }
        };

        const { data: newQuota, error: insertError } = await this.supabase
          .from('ai_quotas')
          .insert(defaultQuota)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return {
          tokensRemaining: defaultQuota.token_limit,
          tokensQuota: defaultQuota.token_limit,
          costRemaining: defaultQuota.usd_limit,
          costQuota: defaultQuota.usd_limit,
          periodStart: monthStart,
          periodEnd: monthEnd,
          isOverQuota: false
        };
      }

      const tokensRemaining = quota.token_limit ? Math.max(0, quota.token_limit - quota.used_tokens) : Infinity;
      const costRemaining = quota.usd_limit ? Math.max(0, quota.usd_limit - quota.used_usd) : Infinity;

      return {
        tokensRemaining,
        tokensQuota: quota.token_limit || 0,
        costRemaining,
        costQuota: quota.usd_limit || 0,
        periodStart: new Date(quota.period_start),
        periodEnd: new Date(quota.period_end),
        isOverQuota: (quota.token_limit && quota.used_tokens >= quota.token_limit) ||
                     (quota.usd_limit && quota.used_usd >= quota.usd_limit) ||
                     false
      };
    } catch (error) {
      logError('Error getting quota info', error as Error, {
        action: 'get_quota_info',
        userId
      });

      // Return permissive default quota if error
      const now = new Date();
      return {
        tokensRemaining: 100000,
        tokensQuota: 100000,
        costRemaining: 10.0,
        costQuota: 10.0,
        periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        isOverQuota: false
      };
    }
  }

  /**
   * Get user's overall usage statistics
   */
  async getUsageStats(userId?: string): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalTokens: number;
    totalImages: number;
    totalCost: number;
    operationBreakdown: Record<string, {
      requests: number;
      tokens: number;
      images: number;
      cost: number;
    }>;
  }> {
    try {
      const uid = userId || await this.getCurrentUserId();

      const { data, error } = await this.supabase!
        .from('ai_usage')
        .select('*')
        .eq('user_id', uid);

      if (error) {
        logError('Error fetching usage stats', error, { action: 'get_usage_stats', userId: uid });
        throw error;
      }

      const records = data || [];

      const stats = {
        totalRequests: records.length,
        successfulRequests: records.filter(r => r.success).length,
        failedRequests: records.filter(r => !r.success).length,
        totalTokens: records.reduce((sum, r) => sum + (r.prompt_tokens || 0) + (r.completion_tokens || 0), 0),
        totalImages: records.filter(r => r.operation === 'image').length,
        totalCost: records.reduce((sum, r) => sum + (r.cost_usd || 0), 0),
        operationBreakdown: {} as Record<string, { requests: number; tokens: number; images: number; cost: number; }>
      };

      // Build operation breakdown
      for (const record of records) {
        const op = record.operation || 'unknown';
        if (!stats.operationBreakdown[op]) {
          stats.operationBreakdown[op] = { requests: 0, tokens: 0, images: 0, cost: 0 };
        }

        stats.operationBreakdown[op].requests++;
        stats.operationBreakdown[op].tokens += (record.prompt_tokens || 0) + (record.completion_tokens || 0);
        stats.operationBreakdown[op].cost += record.cost_usd || 0;

        if (record.operation === 'image') {
          stats.operationBreakdown[op].images++;
        }
      }

      return stats;
    } catch (error) {
      logError('Error getting usage stats', error as Error, { action: 'get_usage_stats', userId });

      // Return empty stats on error
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalImages: 0,
        totalCost: 0,
        operationBreakdown: {}
      };
    }
  }

  /**
   * Get daily usage statistics for a date range
   */
  async getDailyUsage(startDate: Date, endDate: Date, userId?: string): Promise<Array<{
    date: string;
    requests: number;
    tokens: number;
    images: number;
    cost: number;
  }>> {
    try {
      const uid = userId || await this.getCurrentUserId();

      const { data, error } = await this.supabase!
        .from('ai_usage')
        .select('*')
        .eq('user_id', uid)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        logError('Error fetching daily usage', error, { action: 'get_daily_usage', userId: uid });
        throw error;
      }

      const records = data || [];

      // Group by date
      const dailyStats: Record<string, { requests: number; tokens: number; images: number; cost: number }> = {};

      for (const record of records) {
        const date = new Date(record.created_at || '').toISOString().split('T')[0];

        if (!dailyStats[date]) {
          dailyStats[date] = { requests: 0, tokens: 0, images: 0, cost: 0 };
        }

        dailyStats[date].requests++;
        dailyStats[date].tokens += (record.prompt_tokens || 0) + (record.completion_tokens || 0);
        dailyStats[date].cost += record.cost_usd || 0;

        if (record.operation === 'image') {
          dailyStats[date].images++;
        }
      }

      // Fill in missing dates and return array
      const result = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          ...dailyStats[dateStr] || { requests: 0, tokens: 0, images: 0, cost: 0 }
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    } catch (error) {
      logError('Error getting daily usage', error as Error, { action: 'get_daily_usage', userId });

      // Return empty array on error
      return [];
    }
  }

  /**
   * Get user's usage statistics for a given time range
   */
  async getUserUsage(
    userId: string,
    timeRange?: TimeRange
  ): Promise<UsageStats> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase admin client not available');
      }

      const startDate = timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = timeRange?.endDate || new Date();

      const { data: usageData, error } = await this.supabase
        .from('ai_usage')
        .select('operation, success, total_tokens, cost_usd')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const stats: UsageStats = {
        totalRequests: usageData.length,
        successfulRequests: usageData.filter((row: any) => row.success === true).length,
        failedRequests: usageData.filter((row: any) => row.success === false).length,
        totalTokens: usageData.reduce((sum: number, row: any) => sum + (row.total_tokens || 0), 0),
        totalCost: usageData.reduce((sum: number, row: any) => sum + (row.cost_usd || 0), 0),
        operationBreakdown: {}
      };

      // Build operation breakdown
      const operations = ['template', 'entity_fields', 'world_fields', 'image'];
      operations.forEach(op => {
        const opData = usageData.filter((row: any) => row.operation === op);
        stats.operationBreakdown[op] = {
          requests: opData.length,
          tokens: opData.reduce((sum: number, row: any) => sum + (row.total_tokens || 0), 0),
          cost: opData.reduce((sum: number, row: any) => sum + (row.cost_usd || 0), 0)
        };
      });

      return stats;
    } catch (error) {
      logError('Error getting user usage stats', error as Error, {
        action: 'get_user_usage',
        userId
      });

      // Return empty stats if error
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        operationBreakdown: {}
      };
    }
  }


  /**
   * Export user's usage data as CSV
   */
  async exportUsageData(
    userId: string,
    timeRange?: TimeRange
  ): Promise<string> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase admin client not available');
      }

      const startDate = timeRange?.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
      const endDate = timeRange?.endDate || new Date();

      const { data, error } = await this.supabase!
        .from('ai_usage')
        .select('created_at, operation, model, provider, prompt_tokens, completion_tokens, total_tokens, cost_usd, currency, success, error_code')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert to CSV
      const headers = [
        'Date',
        'Operation',
        'Model',
        'Provider',
        'Prompt Tokens',
        'Completion Tokens',
        'Total Tokens',
        'Cost (USD)',
        'Currency',
        'Success',
        'Error Code'
      ];

      const csvRows = [
        headers.join(','),
        ...(data || []).map((row: any) => [
          new Date(row.created_at).toISOString(),
          row.operation,
          row.model || '',
          row.provider || '',
          row.prompt_tokens || 0,
          row.completion_tokens || 0,
          row.total_tokens || 0,
          row.cost_usd || 0,
          row.currency || 'USD',
          row.success === null ? 'pending' : row.success ? 'true' : 'false',
          row.error_code || ''
        ].join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      logError('Error exporting usage data', error as Error, {
        action: 'export_usage_data',
        userId
      });

      return 'Error exporting usage data';
    }
  }

  /**
   * Update quota usage for a user
   */
  private async updateQuotaUsage(userId: string, tokens: number, cost: number): Promise<void> {
    try {
      if (!this.supabase) {
        return;
      }

      const now = new Date();

      // Find current period quota
      const { data: quota, error: quotaError } = await this.supabase
        .from('ai_quotas')
        .select('*')
        .eq('user_id', userId)
        .lte('period_start', now.toISOString())
        .gte('period_end', now.toISOString())
        .single();

      if (quota && !quotaError) {
        // Update existing quota
        const { error: updateError } = await this.supabase
          .from('ai_quotas')
          .update({
            used_tokens: quota.used_tokens + tokens,
            used_usd: quota.used_usd + cost
          })
          .eq('id', quota.id);

        if (updateError) {
          throw updateError;
        }
      }
    } catch (error) {
      logError('Error updating quota usage', error as Error, {
        action: 'update_quota_usage',
        userId
      });
    }
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const aiUsageService = new AIUsageService();

// =====================================================
// CONVENIENCE FUNCTIONS
// =====================================================

/**
 * Quick function to track AI usage
 */
export async function trackAIUsage(request: AIUsageTrackingRequest): Promise<void> {
  return aiUsageService.trackUsage(request);
}

/**
 * Quick function to check quota
 */
export async function checkAIQuota(
  userId: string,
  tokensRequested?: number,
  costRequested?: number
): Promise<boolean> {
  return aiUsageService.checkQuota(userId, tokensRequested, costRequested);
}
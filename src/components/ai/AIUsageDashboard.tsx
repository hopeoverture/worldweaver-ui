'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/ToastProvider';
import { formatCost } from '@/lib/ai-pricing';
import { aiUsageService } from '@/lib/services/aiUsageService';
// Using simple symbols instead of lucide-react icons

interface AIUsageData {
  quota: {
    tokensRemaining: number;
    costRemaining: number;
    tokensQuota: number;
    costQuota: number;
    periodStart: Date;
    periodEnd: Date;
    isOverQuota: boolean;
  };
  usage: {
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
  };
  dailyUsage: Array<{
    date: string;
    requests: number;
    tokens: number;
    images: number;
    cost: number;
  }>;
}

interface AIUsageDashboardProps {
  className?: string;
}


export function AIUsageDashboard({ className }: AIUsageDashboardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ai-usage-dashboard'],
    queryFn: async (): Promise<AIUsageData> => {
      // Get quota info (service will get current user ID internally)
      const quotaInfo = await aiUsageService.getQuotaInfo();

      // Get usage stats
      const usageStats = await aiUsageService.getUsageStats();

      // Get daily usage for the last 7 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      const dailyUsage = await aiUsageService.getDailyUsage(startDate, endDate);

      return {
        quota: {
          tokensRemaining: quotaInfo.tokensRemaining,
          costRemaining: quotaInfo.costRemaining,
          tokensQuota: quotaInfo.tokensQuota,
          costQuota: quotaInfo.costQuota,
          periodStart: quotaInfo.periodStart,
          periodEnd: quotaInfo.periodEnd,
          isOverQuota: quotaInfo.isOverQuota
        },
        usage: usageStats,
        dailyUsage
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // TODO: Replace with actual export API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Export Successful',
        description: 'Your AI usage data has been exported to CSV.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export usage data. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">AI Usage Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">Failed to load AI usage data.</p>
        <Button onClick={handleRefresh} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const { quota, usage, dailyUsage } = data;
  const tokensUsedPercent = quota.tokensQuota > 0 ? ((quota.tokensQuota - quota.tokensRemaining) / quota.tokensQuota) * 100 : 0;
  const costUsedPercent = quota.costQuota > 0 ? ((quota.costQuota - quota.costRemaining) / quota.costQuota) * 100 : 0;
  const successRate = usage.totalRequests > 0 ? (usage.successfulRequests / usage.totalRequests) * 100 : 0;

  const operationIcons = {
    template: '📄',
    entity_fields: '⚡',
    world_fields: '🌍',
    image: '🖼️'
  };

  const operationNames = {
    template: 'Templates',
    entity_fields: 'Entity Fields',
    world_fields: 'World Fields',
    image: 'Images'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI Usage Dashboard</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefetching}
            size="sm"
            variant="outline"
          >
            {isRefetching ? '🔄' : '↻'} Refresh
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            size="sm"
          >
            ⬇ {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Quota Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Quota</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {(quota.tokensQuota - quota.tokensRemaining).toLocaleString()}</span>
              <span>Remaining: {quota.tokensRemaining.toLocaleString()}</span>
            </div>
            <ProgressBar
              value={tokensUsedPercent}
              variant={tokensUsedPercent > 90 ? 'error' : tokensUsedPercent > 75 ? 'warning' : 'success'}
            />
            <p className="text-xs text-gray-500">
              Period: {quota.periodStart.toLocaleDateString()} - {quota.periodEnd.toLocaleDateString()}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Quota</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used: {formatCost(quota.costQuota - quota.costRemaining)}</span>
              <span>Remaining: {formatCost(quota.costRemaining)}</span>
            </div>
            <ProgressBar
              value={costUsedPercent}
              variant={costUsedPercent > 90 ? 'error' : costUsedPercent > 75 ? 'warning' : 'success'}
            />
            <p className="text-xs text-gray-500">
              Period: {quota.periodStart.toLocaleDateString()} - {quota.periodEnd.toLocaleDateString()}
            </p>
          </div>
        </Card>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Requests"
          value={usage.totalRequests}
          icon="⚡"
          trend={{ value: successRate, label: `${successRate.toFixed(1)}% success rate` }}
        />
        <StatCard
          title="Tokens Used"
          value={usage.totalTokens.toLocaleString()}
          icon="📝"
        />
        <StatCard
          title="Images Generated"
          value={usage.totalImages}
          icon="🖼️"
        />
        <StatCard
          title="Total Cost"
          value={formatCost(usage.totalCost)}
          icon="💰"
        />
      </div>

      {/* Operation Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Operation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(usage.operationBreakdown).map(([operation, stats]) => {
            const Icon = operationIcons[operation as keyof typeof operationIcons];
            return (
              <div key={operation} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{operationIcons[operation as keyof typeof operationIcons]}</span>
                  <h4 className="font-medium text-gray-900">
                    {operationNames[operation as keyof typeof operationNames]}
                  </h4>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Requests: {stats.requests}</div>
                  {stats.tokens > 0 && <div>Tokens: {stats.tokens.toLocaleString()}</div>}
                  {stats.images > 0 && <div>Images: {stats.images}</div>}
                  <div>Cost: {formatCost(stats.cost)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Daily Usage Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage (Last 7 Days)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-500">
            {dailyUsage.map((day) => (
              <div key={day.date} className="text-center">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {dailyUsage.map((day) => {
              const maxRequests = Math.max(...dailyUsage.map(d => d.requests));
              const height = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;

              return (
                <div key={day.date} className="flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-sm h-20 flex items-end">
                    <div
                      className="w-full bg-blue-500 rounded-sm transition-all duration-300"
                      style={{ height: `${height}%` }}
                      title={`${day.requests} requests, ${day.tokens} tokens, ${formatCost(day.cost)}`}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{day.requests}</div>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 text-center">
            Hover over bars for details
          </div>
        </div>
      </Card>

      {/* Quota Warning */}
      {(quota.isOverQuota || tokensUsedPercent > 90 || costUsedPercent > 90) && (
        <Card className="p-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl text-yellow-600">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {quota.isOverQuota ? 'Quota Exceeded' : 'Quota Warning'}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {quota.isOverQuota
                  ? 'You have exceeded your AI usage quota. New requests will be blocked until your quota resets.'
                  : 'You are approaching your AI usage limits. Consider upgrading your plan if you need more usage.'
                }
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
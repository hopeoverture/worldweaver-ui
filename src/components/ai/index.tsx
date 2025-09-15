/**
 * Dynamic imports for AI components to reduce initial bundle size
 * These heavy components are only loaded when the AI features are actually used
 */

import { lazy } from 'react';

// Dynamically load AI components to avoid including OpenAI SDK in initial bundle
export const LazyAIGenerateButton = lazy(() =>
  import('./AIGenerateButton').then(module => ({ default: module.AIGenerateButton }))
);

export const LazyAIPromptModal = lazy(() =>
  import('./AIPromptModal').then(module => ({ default: module.AIPromptModal }))
);

export const LazyAIImageUpload = lazy(() =>
  import('./AIImageUpload').then(module => ({ default: module.AIImageUpload }))
);

export const LazyAIUsageDashboard = lazy(() =>
  import('./AIUsageDashboard').then(module => ({ default: module.AIUsageDashboard }))
);

// Loading fallback component
export const AILoadingFallback = () => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 text-sm">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      Loading AI...
    </div>
  );
};
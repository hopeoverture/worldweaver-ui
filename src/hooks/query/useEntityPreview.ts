"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface EntityPreview {
  id: string;
  name: string;
  templateName?: string;
  summary: string;
  coverImageUrl?: string | null;
  worldId: string;
  tags: string[];
}

export interface EntityPreviewResponse {
  entity: EntityPreview;
}

export function useEntityPreview(entityId: string | null | undefined) {
  return useQuery({
    queryKey: ["entity-preview", entityId],
    enabled: !!entityId,
    queryFn: async (): Promise<EntityPreview> => {
      const res = await fetch(`/api/entities/${entityId}/preview`, {
        credentials: "include"
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to load entity preview");
      }

      const body = await res.json();
      return body.entity as EntityPreview;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (entity data doesn't change frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication required')) {
        return false;
      }
      // Don't retry on permission/not found errors
      if (error?.message?.includes('not found') || error?.message?.includes('access denied')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    }
  });
}

/**
 * Hook for prefetching entity preview data
 * Useful for optimistic loading when hovering over markers
 */
export function usePrefetchEntityPreview() {
  const queryClient = useQueryClient();

  return (entityId: string) => {
    if (!entityId) return;

    queryClient.prefetchQuery({
      queryKey: ["entity-preview", entityId],
      queryFn: async (): Promise<EntityPreview> => {
        const res = await fetch(`/api/entities/${entityId}/preview`, {
          credentials: "include"
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || "Failed to load entity preview");
        }

        const body = await res.json();
        return body.entity as EntityPreview;
      },
      staleTime: 10 * 60 * 1000,
    });
  };
}
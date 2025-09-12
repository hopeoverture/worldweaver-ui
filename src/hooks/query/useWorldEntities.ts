"use client";

import { useQuery } from "@tanstack/react-query";
import type { Entity } from "@/lib/types";

export function useWorldEntities(worldId: string) {
  return useQuery({
    queryKey: ['world-entities', worldId],
    queryFn: async () => {
      if (!worldId) {
        throw new Error('World ID is required')
      }

      const response = await fetch(`/api/worlds/${worldId}/entities`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data.entities
    },
    enabled: !!worldId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

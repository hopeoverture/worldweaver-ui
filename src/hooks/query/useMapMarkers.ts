"use client";

import { useQuery } from "@tanstack/react-query";

export interface MapMarker {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  description?: string;
  color: string;
  icon?: string;
  entity_id?: string;
  entity_name?: string;
  entity_template_id?: string;
  entity_template_name?: string;
  layer_name: string;
  layer_kind: string;
  layer_visible: boolean;
  metadata: Record<string, any>;
}

export interface MapMarkersResponse {
  markers: MapMarker[];
  total: number;
}

export function useMapMarkers(worldId: string | null | undefined, mapId: string | null | undefined) {
  return useQuery({
    queryKey: ["map-markers", worldId, mapId],
    enabled: !!worldId && !!mapId,
    queryFn: async (): Promise<MapMarkersResponse> => {
      const res = await fetch(`/api/worlds/${worldId}/maps/${mapId}/markers`, {
        credentials: "include"
      });

      if (res.status === 404) {
        return { markers: [], total: 0 };
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load map markers");
      }

      const body = await res.json();
      return body as MapMarkersResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication required')) {
        return false;
      }
      // Don't retry on permission errors
      if (error?.message?.includes('access denied')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    }
  });
}
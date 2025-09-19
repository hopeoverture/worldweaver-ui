"use client";

import { useQuery } from "@tanstack/react-query";

export interface Map {
  id: string;
  world_id: string;
  name: string;
  description?: string;
  image_path?: string;
  width_px: number;
  height_px: number;
  pixels_per_unit: number;
  default_zoom: number;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useWorldMaps(worldId: string | null | undefined) {
  return useQuery({
    queryKey: ["world-maps", worldId],
    enabled: !!worldId,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/maps`, { credentials: "include" });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("Failed to load maps");
      const body = await res.json();
      return body.maps as Map[];
    },
  });
}

export function useMap(worldId: string | null | undefined, mapId: string | null | undefined) {
  return useQuery({
    queryKey: ["map", worldId, mapId],
    enabled: !!worldId && !!mapId,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/maps/${mapId}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load map");
      const body = await res.json();
      return body;
    },
  });
}
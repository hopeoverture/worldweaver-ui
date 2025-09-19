"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateMapBody = {
  name: string;
  description?: string;
  image_path?: string;
  width_px?: number;
  height_px?: number;
  pixels_per_unit?: number;
  default_zoom?: number;
  is_public?: boolean;
  // Comprehensive map generation fields
  map_purpose?: string;
  map_scale?: string;
  genre_tags?: string[];
  terrain_emphasis?: string[];
  climate_zones?: string[];
  settlement_density?: string;
  political_complexity?: string;
  travel_focus?: string[];
  signature_features?: string[];
  visual_style?: string;
};

export function useCreateMap(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateMapBody) => {
      const res = await fetch(`/api/worlds/${worldId}/maps`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create map");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["world-maps", worldId] });
    },
  });
}
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateMapBody = {
  name?: string;
  description?: string;
  is_public?: boolean;
};

export function useUpdateMap(worldId: string, mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateMapBody) => {
      const res = await fetch(`/api/worlds/${worldId}/maps/${mapId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to update map");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both the map list and the specific map queries
      qc.invalidateQueries({ queryKey: ["world-maps", worldId] });
      qc.invalidateQueries({ queryKey: ["map", mapId] });
    },
  });
}
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteMap(worldId: string, mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/maps/${mapId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete map");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the map list query to remove the deleted map
      qc.invalidateQueries({ queryKey: ["world-maps", worldId] });
      // Remove the specific map from cache
      qc.removeQueries({ queryKey: ["map", mapId] });
    },
  });
}
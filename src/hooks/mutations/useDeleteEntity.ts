"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteEntity(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entityId: string) => {
      const res = await fetch(`/api/entities/${entityId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete entity");
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entities", worldId] });
      qc.invalidateQueries({ queryKey: ["world-folders", worldId] }); // Update folder counts
    },
  });
}
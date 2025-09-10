"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, worldId }: { id: string; worldId: string }) => {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete folder");
      }
      return { worldId };
    },
    onSuccess: ({ worldId }) => {
      qc.invalidateQueries({ queryKey: ["folders", worldId] });
    },
  });
}


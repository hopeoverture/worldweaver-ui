"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type Body = { id: string; worldId: string; name?: string; description?: string; color?: string | null };

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, worldId, ...patch }: Body) => {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to update folder");
      }
      return { worldId };
    },
    onSuccess: ({ worldId }) => {
      qc.invalidateQueries({ queryKey: ["folders", worldId] });
    },
  });
}


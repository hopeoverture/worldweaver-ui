"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type Body = { name: string; description?: string; color?: string; kind?: 'entities' | 'templates' };

export function useCreateFolder(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Body) => {
      const res = await fetch(`/api/worlds/${worldId}/folders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create folder");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders", worldId] });
    },
  });
}


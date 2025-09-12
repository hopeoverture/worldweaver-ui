"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type Body = {
  name: string;
  templateId?: string;
  folderId?: string;
  fields: Record<string, unknown>;
  tags?: string[];
};

export function useCreateEntity(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Body) => {
      const res = await fetch(`/api/worlds/${worldId}/entities`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create entity");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["world-entities", worldId] });
    },
  });
}


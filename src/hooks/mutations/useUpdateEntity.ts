"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type Patch = {
  name?: string;
  templateId?: string | null;
  folderId?: string | null;
  fields?: Record<string, unknown>;
  tags?: string[] | null;
};

export function useUpdateEntity(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; patch: Patch }) => {
      const res = await fetch(`/api/entities/${args.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(args.patch),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to update entity");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["world-entities", worldId] });
    },
  });
}


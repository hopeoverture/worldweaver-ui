"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Template } from "@/lib/types";

type Patch = Partial<Pick<Template, 'name' | 'description' | 'icon' | 'category' | 'fields' | 'folderId'>> & {
  // When editing a system template, include the worldId to create a world-scoped override
  worldId?: string;
};

export function useUpdateTemplate(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; patch: Patch }) => {
      const res = await fetch(`/api/templates/${args.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...args.patch, worldId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to update template");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates", worldId] });
    },
  });
}


"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TemplateField } from "@/lib/types";

type Body = {
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  fields: TemplateField[];
  folderId?: string;
};

export function useCreateTemplate(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Body) => {
      const res = await fetch(`/api/worlds/${worldId}/templates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create template");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates", worldId] });
    },
  });
}

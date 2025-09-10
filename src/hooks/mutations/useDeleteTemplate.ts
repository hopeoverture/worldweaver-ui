"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteTemplate(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete template");
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates", worldId] });
    },
  });
}


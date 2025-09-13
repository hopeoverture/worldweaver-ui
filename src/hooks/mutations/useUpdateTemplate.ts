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
    onMutate: async (variables) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await qc.cancelQueries({ queryKey: ["templates", worldId] });

      // Snapshot the previous value
      const previousTemplates = qc.getQueryData(["templates", worldId]);

      // Optimistically update to the new value
      qc.setQueryData(["templates", worldId], (old: Template[] | undefined) => {
        if (!old) return old;
        return old.map((template) =>
          template.id === variables.id
            ? { ...template, ...variables.patch }
            : template
        );
      });

      // Return a context object with the snapshotted value
      return { previousTemplates };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTemplates) {
        qc.setQueryData(["templates", worldId], context.previousTemplates);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have latest data
      qc.invalidateQueries({ queryKey: ["templates", worldId] });
    },
  });
}


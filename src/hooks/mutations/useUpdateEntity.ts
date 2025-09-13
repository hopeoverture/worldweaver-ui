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
    onMutate: async (variables) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await qc.cancelQueries({ queryKey: ["world-entities", worldId] });

      // Snapshot the previous value
      const previousEntities = qc.getQueryData(["world-entities", worldId]);

      // Optimistically update to the new value
      qc.setQueryData(["world-entities", worldId], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((entity) =>
          entity.id === variables.id
            ? { ...entity, ...variables.patch }
            : entity
        );
      });

      // Return a context object with the snapshotted value
      return { previousEntities };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEntities) {
        qc.setQueryData(["world-entities", worldId], context.previousEntities);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have latest data
      qc.invalidateQueries({ queryKey: ["world-entities", worldId] });
    },
  });
}


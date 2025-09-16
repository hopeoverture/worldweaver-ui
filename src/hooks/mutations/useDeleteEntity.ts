"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteEntity(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entityId: string) => {
      console.log(`🗑️ Attempting to delete entity:`, entityId);

      const res = await fetch(`/api/entities/${entityId}`, {
        method: "DELETE",
        credentials: "include"
      });

      console.log(`🗑️ Delete response:`, {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`🚨 Delete failed:`, {
          status: res.status,
          statusText: res.statusText,
          responseText: text,
          entityId
        });
        throw new Error(text || `Failed to delete entity (${res.status})`);
      }

      const result = await res.json().catch(() => ({ ok: true }));
      console.log(`✅ Delete successful:`, result);
      return { entityId };
    },
    onMutate: async (entityId: string) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await qc.cancelQueries({ queryKey: ["world-entities", worldId] });

      // Snapshot the previous value
      const previousEntities = qc.getQueryData(["world-entities", worldId]);

      // Optimistically remove the entity from the cache
      qc.setQueryData(["world-entities", worldId], (old: any[] | undefined) => {
        if (!old) return old;
        return old.filter((entity) => entity.id !== entityId);
      });

      // Return a context object with the snapshotted value
      return { previousEntities };
    },
    onError: (err, entityId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEntities) {
        qc.setQueryData(["world-entities", worldId], context.previousEntities);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have latest data
      qc.invalidateQueries({ queryKey: ["world-entities", worldId] });
      qc.invalidateQueries({ queryKey: ["world-folders", worldId] }); // Update folder counts
    },
  });
}
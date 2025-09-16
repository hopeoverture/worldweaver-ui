"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type Patch = {
  name?: string;
  templateId?: string | null;
  folderId?: string | null;
  fields?: Record<string, unknown>;
  tags?: string[] | null;
  imageUrl?: string | null;
  summary?: string;
};

export function useUpdateEntity(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; patch: Patch }) => {
      const startTime = Date.now();
      console.log(`🔄 useUpdateEntity attempting:`, {
        entityId: args.id,
        patch: args.patch,
        timestamp: new Date().toISOString()
      });

      // Pre-flight auth check to ensure session is valid
      try {
        const authCheck = await fetch('/api/worlds', { credentials: 'include' });
        if (!authCheck.ok) {
          console.warn('⚠️ Pre-flight auth check failed, attempting anyway...');
        } else {
          console.log('✅ Pre-flight auth check passed');
        }
      } catch (e) {
        console.warn('⚠️ Pre-flight auth check error:', e);
      }

      const res = await fetch(`/api/entities/${args.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(args.patch),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const errorDetails = {
          status: res.status,
          statusText: res.statusText,
          url: res.url,
          responseText: text,
          entityId: args.id,
          patch: args.patch
        };
        console.error(`🚨 useUpdateEntity failed:`, errorDetails);
        console.error(`🚨 Individual properties:`, {
          'Status': res.status,
          'Status Text': res.statusText,
          'Response': text,
          'Entity ID': args.id
        });

        // If authentication failed, try one retry after session refresh
        if (res.status === 401) {
          console.warn('🔄 Authentication failed, attempting retry with session refresh...');
          try {
            // Force session refresh by calling a working endpoint
            const refreshResult = await fetch('/api/worlds', { credentials: 'include' });
            console.log('🔄 Session refresh result:', refreshResult.status);

            // Retry the original request once
            console.log('🔄 Retrying original request after session refresh...');
            const retryRes = await fetch(`/api/entities/${args.id}`, {
              method: "PUT",
              headers: { "content-type": "application/json" },
              credentials: "include",
              body: JSON.stringify(args.patch),
            });

            if (retryRes.ok) {
              console.log('✅ Retry successful after session refresh!');
              return retryRes.json();
            } else {
              console.error('🚨 Retry also failed:', retryRes.status, retryRes.statusText);
            }
          } catch (e) {
            console.warn('⚠️ Session refresh/retry failed:', e);
          }
        }

        const error = new Error(text || "Failed to update entity");
        (error as any).status = res.status;
        (error as any).statusText = res.statusText;
        throw error;
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


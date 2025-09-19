"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateRelationshipBody = {
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  strength?: number;
  isBidirectional?: boolean;
};

export function useCreateRelationship(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateRelationshipBody) => {
      const res = await fetch(`/api/worlds/${worldId}/relationships`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        // Provide more specific error messages based on status
        let errorMessage = errorData.error || 'Failed to create relationship';
        if (res.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (res.status === 403) {
          errorMessage = 'You do not have permission to create relationships in this world.';
        } else if (res.status === 404) {
          errorMessage = 'World not found or one of the selected entities no longer exists.';
        } else if (res.status === 400 && errorData.details) {
          errorMessage = `Invalid data: ${errorData.details.map((d: any) => d.message).join(', ')}`;
        }
        
        throw new Error(errorMessage);
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relationships query to refresh the UI
      qc.invalidateQueries({ queryKey: ["world-relationships", worldId] });
    },
  });
}
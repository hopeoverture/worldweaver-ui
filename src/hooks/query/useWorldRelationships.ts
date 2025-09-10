"use client";

import { useQuery } from "@tanstack/react-query";
import type { RelationshipRow } from "@/lib/types";

export function useWorldRelationships(worldId: string) {
  return useQuery({
    queryKey: ["world-relationships", worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/relationships`, { 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to load relationships");
      const body = await res.json();
      return (body.relationships ?? []) as RelationshipRow[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
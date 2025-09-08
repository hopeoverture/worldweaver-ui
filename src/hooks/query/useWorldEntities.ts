"use client";

import { useQuery } from "@tanstack/react-query";
import type { Entity } from "@/lib/types";

export function useWorldEntities(worldId: string | undefined) {
  return useQuery({
    queryKey: ["entities", worldId],
    enabled: !!worldId,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/entities`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load entities");
      const body = await res.json();
      return (body.entities ?? []) as Entity[];
    },
  });
}

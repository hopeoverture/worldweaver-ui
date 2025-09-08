"use client";

import { useQuery } from "@tanstack/react-query";
import type { Template } from "@/lib/types";

export function useWorldTemplates(worldId: string | undefined) {
  return useQuery({
    queryKey: ["templates", worldId],
    enabled: !!worldId,
    queryFn: async () => {
      const wid = String(worldId);
      const res = await fetch(`/api/worlds/${wid}/templates`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load templates");
      const body = await res.json();
      const items = (body.templates ?? []) as Template[];

      // Client-side deduplication: prefer world-specific overrides over system templates by name
      const byName = new Map<string, Template>();
      for (const t of items) {
        const key = (t.name || "").toLowerCase();
        if (t.worldId === wid) byName.set(key, t);
      }
      for (const t of items) {
        const key = (t.name || "").toLowerCase();
        if (!byName.has(key)) byName.set(key, t);
      }
      
      return Array.from(byName.values());
    },
  });
}

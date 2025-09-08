"use client";

import { useQuery } from "@tanstack/react-query";
import type { Folder } from "@/lib/types";

export function useWorldFolders(worldId: string | undefined) {
  return useQuery({
    queryKey: ["folders", worldId],
    enabled: !!worldId,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/folders`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load folders");
      const body = await res.json();
      return (body.folders ?? []) as Folder[];
    },
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import type { WorldInvite } from "@/lib/types";

export function useInvites(worldId: string | null | undefined) {
  return useQuery({
    queryKey: ["invites", worldId],
    enabled: !!worldId,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/invites`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load invites");
      const body = await res.json();
      return (body.invites ?? []) as WorldInvite[];
    },
  });
}

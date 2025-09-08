"use client";

import { useQuery } from "@tanstack/react-query";

export function useWorld(id: string | null | undefined) {
  return useQuery({
    queryKey: ["world", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${id}`, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load world");
      const body = await res.json();
      return body.world;
    },
  });
}


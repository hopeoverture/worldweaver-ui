"use client";

import { useQuery } from "@tanstack/react-query";
import type { World } from "@/lib/types";

export function useWorlds() {
  return useQuery({
    queryKey: ["worlds"],
    queryFn: async () => {
      const res = await fetch("/api/worlds", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load worlds");
      const body = await res.json();
      return body.worlds ?? [];
    },
  });
}

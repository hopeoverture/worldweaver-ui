"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { World } from "@/lib/types";

export function useWorlds() {
  const { user, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ["worlds", user?.id],
    queryFn: async () => {
      console.log("🔍 CLIENT: About to fetch worlds for user:", user?.id);
      
      const res = await fetch("/api/worlds", { credentials: "include" });
      
      console.log("🔍 CLIENT: Fetch worlds response:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log("🔍 CLIENT: 401 Unauthorized - user not signed in");
          throw new Error("Please sign in to view your worlds");
        }
        const errorText = await res.text().catch(() => "");
        console.log("🔍 CLIENT: Error response text:", errorText);
        throw new Error("Failed to load worlds");
      }
      
      const body = await res.json();
      console.log("🔍 CLIENT: Worlds response body:", body);
      console.log("🔍 CLIENT: Extracted worlds from body.data.worlds:", body.data?.worlds);
      
      return body.data?.worlds ?? [];
    },
    enabled: !authLoading && !!user, // Only run when authenticated
  });
}

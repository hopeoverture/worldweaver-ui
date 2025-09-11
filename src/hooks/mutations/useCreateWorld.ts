"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/contexts/AuthContext";

type Body = {
  name: string;
  description?: string;
  isPublic?: boolean;
  // Extended world-creation fields
  logline?: string;
  genreBlend?: string[];
  overallTone?: string;
  keyThemes?: string[];
  audienceRating?: string;
  scopeScale?: string;
  technologyLevel?: string[];
  magicLevel?: string[];
  cosmologyModel?: string;
  climateBiomes?: string[];
  calendarTimekeeping?: string;
  societalOverview?: string;
  conflictDrivers?: string[];
  rulesConstraints?: string;
  aestheticDirection?: string;
};

export function useCreateWorld() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (body: Body) => {
      console.log("🎯 CLIENT: About to create world with data:", body);
      
      const res = await fetch("/api/worlds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      console.log("🎯 CLIENT: Create world response:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.log("🎯 CLIENT: Error response text:", text);
        throw new Error(text || "Failed to create world");
      }
      
      const data = await res.json();
      console.log("🎯 CLIENT: Success response data:", data);
      return data;
    },
    onSuccess: () => {
      // Invalidate both the general worlds query and the user-specific one
      qc.invalidateQueries({ queryKey: ["worlds"] });
      if (user?.id) {
        qc.invalidateQueries({ queryKey: ["worlds", user.id] });
      }
      toast({ title: "World created", variant: "success" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to create world", description: String(e?.message || e), variant: "error" });
    }
  });
}

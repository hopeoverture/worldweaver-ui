"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";

type Body = { name: string; description?: string; isPublic?: boolean };

export function useCreateWorld() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (body: Body) => {
      const res = await fetch("/api/worlds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create world");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["worlds"] });
      toast({ title: "World created", variant: "success" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to create world", description: String(e?.message || e), variant: "error" });
    }
  });
}

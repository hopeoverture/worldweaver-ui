"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";

type Patch = Partial<{
  name: string;
  description: string;
  isPublic: boolean;
  isArchived: boolean;
}>;

export function useUpdateWorld(worldId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (patch: Patch) => {
      const res = await fetch(`/api/worlds/${worldId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to update world");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["worlds"] });
      qc.invalidateQueries({ queryKey: ["world", worldId] });
      toast({ title: "World updated", variant: "success" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update world", description: String(e?.message || e), variant: "error" });
    }
  });
}

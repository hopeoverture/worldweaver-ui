"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/contexts/AuthContext";

export function useDeleteWorld() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (worldId: string) => {
      const res = await fetch(`/api/worlds/${worldId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to delete world");
      }
      return true;
    },
    onSuccess: () => {
      // Invalidate both the general worlds query and the user-specific one
      qc.invalidateQueries({ queryKey: ["worlds"] });
      if (user?.id) {
        qc.invalidateQueries({ queryKey: ["worlds", user.id] });
      }
      toast({ title: "World deleted", variant: "success" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to delete world", description: String(e?.message || e), variant: "error" });
    }
  });
}

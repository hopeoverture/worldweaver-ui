"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/contexts/AuthContext";

type Patch = Partial<{
  name: string;
  description: string;
  isPublic: boolean;
  isArchived: boolean;
  // Extended fields for world settings
  inviteLinkEnabled: boolean;
  inviteLinkRole: string;
  inviteLinkExpires: string;
  inviteLinkMaxUses: number;
  seatLimit: number;
  // Allow any other settings
  [key: string]: any;
}>;

export function useUpdateWorld(worldId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      // Invalidate both the general worlds query and the user-specific one
      qc.invalidateQueries({ queryKey: ["worlds"] });
      if (user?.id) {
        qc.invalidateQueries({ queryKey: ["worlds", user.id] });
      }
      qc.invalidateQueries({ queryKey: ["world", worldId] });
      toast({ title: "World updated", variant: "success" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update world", description: String(e?.message || e), variant: "error" });
    }
  });
}

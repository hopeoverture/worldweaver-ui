"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useRevokeInvite(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch(`/api/worlds/${worldId}/invites/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to revoke invite");
      }
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invites", worldId] });
    },
  });
}


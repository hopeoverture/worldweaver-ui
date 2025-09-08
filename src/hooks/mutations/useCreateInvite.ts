"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateInvite(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; role: "owner" | "admin" | "editor" | "viewer" }) => {
      const res = await fetch(`/api/worlds/${worldId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create invite");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invites", worldId] });
    },
  });
}


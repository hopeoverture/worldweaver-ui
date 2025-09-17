"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AIEntitySummaryPreviewRequest,
  AIEntitySummaryPreviewResponse
} from "@/lib/types";

export function useGenerateEntitySummaryPreview() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: AIEntitySummaryPreviewRequest): Promise<AIEntitySummaryPreviewResponse> => {
      const res = await fetch("/api/ai/generate-entity-summary-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate entity summary preview");
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      const wordCount = data.summary.split(/\s+/).length;

      toast({
        title: "Entity summary generated successfully",
        description: `Generated a ${wordCount}-word summary preview. Review and edit as needed.`,
        variant: "success"
      });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to generate entity summary preview",
        description: String(e?.message || e),
        variant: "error"
      });
    }
  });
}
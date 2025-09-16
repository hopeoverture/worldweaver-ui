"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AIEntitySummaryGenerationRequest,
  AIEntitySummaryGenerationResponse
} from "@/lib/types";

export function useGenerateEntitySummary() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: AIEntitySummaryGenerationRequest): Promise<AIEntitySummaryGenerationResponse> => {
      const res = await fetch("/api/ai/generate-entity-summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate entity summary");
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      const wordCount = data.summary.split(/\s+/).length;

      toast({
        title: "Entity summary generated successfully",
        description: `Generated a ${wordCount}-word summary. Review and edit as needed.`,
        variant: "success"
      });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to generate entity summary",
        description: String(e?.message || e),
        variant: "error"
      });
    }
  });
}
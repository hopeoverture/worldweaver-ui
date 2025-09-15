"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AITemplateGenerationRequest,
  AITemplateGenerationResponse
} from "@/lib/types";

export function useGenerateTemplate() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: AITemplateGenerationRequest): Promise<AITemplateGenerationResponse> => {
      const res = await fetch("/api/ai/generate-template", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate template");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Template generated successfully",
        description: "Review and customize the generated template before saving.",
        variant: "success"
      });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to generate template",
        description: String(e?.message || e),
        variant: "error"
      });
    }
  });
}
"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AIEntityFieldsGenerationRequest,
  AIEntityFieldsGenerationResponse
} from "@/lib/types";

export function useGenerateEntityFields() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: AIEntityFieldsGenerationRequest): Promise<AIEntityFieldsGenerationResponse> => {
      const res = await fetch("/api/ai/generate-entity-fields", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate entity fields");
      }

      return res.json();
    },
    onError: (e: any) => {
      console.error('AI field generation error:', e);

      // Parse error response for better error messages
      let errorMessage = String(e?.message || e);
      try {
        const errorData = JSON.parse(errorMessage);
        if (errorData.error) {
          errorMessage = errorData.error;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        }
      } catch {
        // If parsing fails, use the original message
      }

      toast({
        title: "Failed to generate entity fields",
        description: errorMessage,
        variant: "error"
      });
    }
  });
}
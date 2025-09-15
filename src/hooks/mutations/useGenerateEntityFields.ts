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
    onSuccess: (data, variables) => {
      const fieldCount = Object.keys(data.fields).length;
      const fieldText = fieldCount === 1 ? "field" : "fields";

      toast({
        title: "Entity fields generated successfully",
        description: `Generated ${fieldCount} ${fieldText}. Review and edit as needed.`,
        variant: "success"
      });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to generate entity fields",
        description: String(e?.message || e),
        variant: "error"
      });
    }
  });
}
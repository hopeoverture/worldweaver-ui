"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AIWorldFieldsGenerationRequest,
  AIWorldFieldsGenerationResponse
} from "@/lib/types";

export function useGenerateWorldFields() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: AIWorldFieldsGenerationRequest): Promise<AIWorldFieldsGenerationResponse> => {
      const res = await fetch("/api/ai/generate-world-fields", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate world fields");
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      const fieldCount = Object.keys(data.fields).length;
      const fieldText = fieldCount === 1 ? "field" : "fields";

      toast({
        title: "World fields generated successfully",
        description: `Generated ${fieldCount} ${fieldText}. Review and customize as needed.`,
        variant: "success"
      });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to generate world fields",
        description: String(e?.message || e),
        variant: "error"
      });
    }
  });
}
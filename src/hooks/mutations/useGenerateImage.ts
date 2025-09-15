"use client";

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AIImageGenerationRequest,
  AIImageGenerationResponse
} from "@/lib/types";

export function useGenerateImage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: AIImageGenerationRequest): Promise<AIImageGenerationResponse> => {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to generate image");
      }

      return res.json();
    },
    onSuccess: (data, variables) => {
      const imageType = variables.type === 'entity' ? 'Entity' : 'World cover';
      toast({
        title: `${imageType} image generated successfully`,
        description: "Preview the generated image and save if you're satisfied.",
        variant: "success"
      });
    },
    onError: (e: any) => {
      toast({
        title: "Failed to generate image",
        description: String(e?.message || e),
        variant: "error"
      });
    }
  });
}
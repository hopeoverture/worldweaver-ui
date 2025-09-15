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
      console.log('🌐 Making fetch request to /api/ai/generate-world-fields');
      console.log('📦 Request payload:', {
        prompt: request.prompt,
        fieldsToGenerate: request.fieldsToGenerate,
        hasExistingData: !!request.existingData,
        existingDataKeys: request.existingData ? Object.keys(request.existingData) : []
      });

      const fetchStartTime = Date.now();

      const res = await fetch("/api/ai/generate-world-fields", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });

      const fetchDuration = Date.now() - fetchStartTime;
      console.log(`🌐 Fetch completed in ${fetchDuration}ms with status: ${res.status}`);

      if (!res.ok) {
        console.error(`❌ HTTP Error ${res.status}: ${res.statusText}`);

        let errorText = "";
        let errorData = null;

        try {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            errorData = await res.json();
            errorText = errorData.error || `HTTP ${res.status}`;
            console.error('❌ Error response data:', errorData);
          } else {
            errorText = await res.text();
            console.error('❌ Error response text:', errorText);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorText = `HTTP ${res.status}: Failed to parse error response`;
        }

        throw new Error(errorText || "Failed to generate world fields");
      }

      console.log('✅ Successful response, parsing JSON...');
      const responseData = await res.json();
      console.log('📄 Response data:', {
        hasFields: !!responseData.fields,
        fieldsCount: responseData.fields ? Object.keys(responseData.fields).length : 0,
        fieldKeys: responseData.fields ? Object.keys(responseData.fields) : []
      });

      return responseData;
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
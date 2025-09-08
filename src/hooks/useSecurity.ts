/**
 * React hooks for security and sanitization
 */
import { useMemo } from 'react';
import { sanitizeHtml, sanitizeText, sanitizeTemplateField, validateJsonField } from '@/lib/security';

/**
 * Hook to safely render HTML content
 */
export function useSafeHtml(htmlContent: string): string {
  return useMemo(() => {
    return sanitizeHtml(htmlContent);
  }, [htmlContent]);
}

/**
 * Hook to safely render text content
 */
export function useSafeText(textContent: string): string {
  return useMemo(() => {
    return sanitizeText(textContent);
  }, [textContent]);
}

/**
 * Hook to validate and sanitize form field values
 */
export function useSafeFormField(fieldType: string, value: unknown) {
  return useMemo(() => {
    return sanitizeTemplateField(fieldType, value);
  }, [fieldType, value]);
}

/**
 * Hook to validate JSON fields in entity forms
 */
export function useValidateJson(value: unknown) {
  return useMemo(() => {
    return validateJsonField(value);
  }, [value]);
}

import { TemplateField } from './types';

export function isRequired(field: TemplateField): boolean {
  return !!field.required;
}

export function validateEntity(input: { name?: string }): string[] {
  const errs: string[] = [];
  if (!input.name || !input.name.trim()) errs.push('Name is required.');
  return errs;
}

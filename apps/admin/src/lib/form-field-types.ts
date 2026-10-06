/** Shared form field type constants (no 'use server' — safe to import from client components). */

export const FORM_FIELD_TYPES = [
  'text',
  'email',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'number',
  'tel',
  'url',
  'date',
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

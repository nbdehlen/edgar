import { HttpError } from '../errors/http-error.js';

export function malformed(): never {
  throw new HttpError(502, 'Malformed SEC response');
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) malformed();
  return value as Record<string, unknown>;
}

export function string(value: unknown, allowBlank = false): string {
  if (typeof value !== 'string' || (!allowBlank && !value.trim())) malformed();
  return value;
}

export function date(value: unknown): string {
  const text = string(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) malformed();
  const parsed = new Date(text);
  // Date parsing can roll invalid days into the next month; require an exact match.
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    malformed();
  }
  return text;
}

export function normalizeCik(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') malformed();
  const text = String(value);
  if (!/^\d{1,10}$/.test(text) || Number(text) === 0) malformed();
  return text.padStart(10, '0');
}

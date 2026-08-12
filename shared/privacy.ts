const sensitiveKey = /password|secret|token|api[-_]?key|authorization|cookie|email|phone/i;
const sensitiveValue = /(sk-[a-z0-9_-]{12,}|-----begin [a-z ]+-----|@|\+?\d[\d ()-]{7,})/i;

/** Deterministic guard: the demo accepts only non-identifying answer fields. */
export function isSafeDemoPayload(value: unknown): boolean {
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return true;
  if (typeof value === 'string') return !sensitiveValue.test(value);
  if (Array.isArray(value)) return value.every(isSafeDemoPayload);
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>)
    .every(([key, item]) => !sensitiveKey.test(key) && isSafeDemoPayload(item));
  return false;
}

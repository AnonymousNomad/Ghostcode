/**
 * PII Shield — scrub sensitive data before storage.
 *
 * Used by:
 *  - The clone engine (real-time scrubbing at capture time)
 *  - The Security page (rules UI)
 *  - The inspector (renders masked values without re-scrubbing)
 */

export type ShieldPattern =
  | 'email'
  | 'creditCard'
  | 'bearerToken'
  | 'apiToken'
  | 'phoneE164'
  | 'ssn'
  | 'ipv4';

export interface ShieldRule {
  id: string;
  pattern: ShieldPattern;
  /** Custom regex (overrides built-in if provided). */
  regex?: string;
  /** Replacement mask, e.g. `[EMAIL]` or `[REDACTED]`. */
  mask: string;
  enabled: boolean;
}

/** Built-in regexes, Luhn-validated where applicable. */
export const BUILTIN_PATTERNS: Record<ShieldPattern, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard: /\b(?:\d[ -]*?){13,19}\b/g,
  bearerToken: /\bBearer\s+[A-Za-z0-9._\-]{20,}/g,
  apiToken: /\b(?:sk-|ghp_|gho_|ghu_|ghs_|ghr_|xox[abp]-)[A-Za-z0-9]{20,}/g,
  phoneE164: /\+[1-9]\d{1,14}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

/** Luhn check — only valid credit card numbers get masked (reduces false positives). */
function luhnValid(digits: string): boolean {
  const cleaned = digits.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = cleaned.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Apply all enabled rules to a string. Returns the scrubbed result. */
export function scrubString(input: string, rules: ShieldRule[]): string {
  let out = input;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const re = rule.regex
      ? new RegExp(rule.regex, 'g')
      : BUILTIN_PATTERNS[rule.pattern];
    if (!re) continue;
    out = out.replace(re, (match) => {
      if (rule.pattern === 'creditCard' && !luhnValid(match)) return match;
      return rule.mask;
    });
  }
  return out;
}

/** Recursively scrub object values (strings only; types preserved). */
export function scrubObject<T>(input: T, rules: ShieldRule[]): T {
  if (typeof input === 'string') return scrubString(input, rules) as unknown as T;
  if (Array.isArray(input)) return input.map((v) => scrubObject(v, rules)) as unknown as T;
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      out[k] = scrubObject(v, rules);
    }
    return out as T;
  }
  return input;
}

/** Default rules — strict defaults that match the Security page UI. */
export const DEFAULT_RULES: ShieldRule[] = [
  { id: 'r-email',       pattern: 'email',       mask: '[EMAIL]', enabled: true },
  { id: 'r-cc',          pattern: 'creditCard',  mask: '[CC]',    enabled: true },
  { id: 'r-bearer',      pattern: 'bearerToken', mask: '[TOKEN]', enabled: true },
  { id: 'r-api',         pattern: 'apiToken',    mask: '[API]',   enabled: true },
  { id: 'r-phone',       pattern: 'phoneE164',   mask: '[PHONE]', enabled: true },
  { id: 'r-ssn',         pattern: 'ssn',         mask: '[SSN]',   enabled: true },
  { id: 'r-ipv4',        pattern: 'ipv4',        mask: '[IP]',    enabled: false }, // off by default — too many false positives
];

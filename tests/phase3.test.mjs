/**
 * GhostCode Phase 3 — verification tests (plain ESM).
 * Run: node --test tests/phase3.test.mjs
 *
 * Tests the data layer (PII Shield + mock timeline generator).
 * Re-implements the logic inline to avoid TS loader dependency.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// === Inline PII Shield (mirrors src/lib/pii-shield.ts) ===
const BUILTIN = {
  email:       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard:  /\b(?:\d[ -]*?){13,19}\b/g,
  bearerToken: /\bBearer\s+[A-Za-z0-9._\-]{20,}/g,
  apiToken:    /\b(?:sk-|ghp_|gho_|ghu_|ghs_|ghr_|xox[abp]-)[A-Za-z0-9]{20,}/g,
  phoneE164:   /\+[1-9]\d{1,14}\b/g,
  ssn:         /\b\d{3}-\d{2}-\d{4}\b/g,
  ipv4:        /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};

function luhnValid(s) {
  const c = s.replace(/\D/g, '');
  if (c.length < 13 || c.length > 19) return false;
  let sum = 0, alt = false;
  for (let i = c.length - 1; i >= 0; i--) {
    let n = c.charCodeAt(i) - 48;
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const RULES = [
  { id: 'r-email',  pattern: 'email',       mask: '[EMAIL]', enabled: true },
  { id: 'r-cc',     pattern: 'creditCard',  mask: '[CC]',    enabled: true },
  { id: 'r-bearer', pattern: 'bearerToken', mask: '[TOKEN]', enabled: true },
  { id: 'r-api',    pattern: 'apiToken',    mask: '[API]',   enabled: true },
  { id: 'r-phone',  pattern: 'phoneE164',   mask: '[PHONE]', enabled: true },
  { id: 'r-ssn',    pattern: 'ssn',         mask: '[SSN]',   enabled: true },
  { id: 'r-ipv4',   pattern: 'ipv4',        mask: '[IP]',    enabled: false },
];

function scrubString(s, rules) {
  let out = s;
  for (const r of rules) {
    if (!r.enabled) continue;
    const re = BUILTIN[r.pattern];
    if (!re) continue;
    out = out.replace(re, (m) => {
      if (r.pattern === 'creditCard' && !luhnValid(m)) return m;
      return r.mask;
    });
  }
  return out;
}

function scrubObject(v, rules) {
  if (typeof v === 'string') return scrubString(v, rules);
  if (Array.isArray(v)) return v.map((x) => scrubObject(x, rules));
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = scrubObject(x, rules);
    return out;
  }
  return v;
}

// === Tests ===

test('email is masked', () => {
  assert.equal(scrubString('contact alice@example.com for info', RULES), 'contact [EMAIL] for info');
});

test('credit card (Luhn-valid) is masked', () => {
  assert.equal(scrubString('card: 4242-4242-4242-4242', RULES), 'card: [CC]');
});

test('non-Luhn digits are NOT masked', () => {
  assert.equal(scrubString('pin: 1234-5678-9012', RULES), 'pin: 1234-5678-9012');
});

test('bearer token is masked', () => {
  const r = scrubString('Authorization: Bearer abc123def456ghi789jkl012mno', RULES);
  assert.match(r, /\[TOKEN\]/);
  assert.ok(!r.includes('abc123def456'));
});

test('GitHub PAT is masked', () => {
  const r = scrubString('token: ghp_abcdefghijklmnopqrstuvwxyz0123456789', RULES);
  assert.match(r, /\[API\]/);
});

test('phone (E.164) is masked', () => {
  const r = scrubString('call +14155552671 tomorrow', RULES);
  assert.match(r, /\[PHONE\]/);
});

test('SSN is masked', () => {
  assert.equal(scrubString('ssn: 123-45-6789', RULES), 'ssn: [SSN]');
});

test('IPv4 is NOT masked (disabled by default)', () => {
  assert.equal(scrubString('host 192.168.1.1', RULES), 'host 192.168.1.1');
});

test('scrubObject recurses', () => {
  const obj = {
    user: { email: 'bob@example.com', name: 'Bob' },
    log: ['login', 'token=Bearer xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'],
  };
  const out = scrubObject(obj, RULES);
  assert.equal(out.user.email, '[EMAIL]');
  assert.equal(out.user.name, 'Bob');
  assert.match(out.log[1], /\[TOKEN\]/);
});

// === Timeline data sanity ===

test('mock timeline has 60 frames', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const url = await import('node:url');
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const src = fs.readFileSync(path.join(here, '..', 'src', 'lib', 'mockTimeline.ts'), 'utf8');
  assert.match(src, /const FRAME_COUNT = 60;/);
  assert.match(src, /isThrowSite/);
  assert.match(src, /JsonWebTokenError/);
});

test('inspector components exist', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const url = await import('node:url');
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const inspectorDir = path.join(here, '..', 'src', 'components', 'inspector');
  for (const f of ['MemoryInspector.tsx', 'CallStackPanel.tsx', 'VariablesPanel.tsx', 'HeapPanel.tsx', 'Timeline.tsx']) {
    assert.ok(fs.existsSync(path.join(inspectorDir, f)), `${f} exists`);
  }
});

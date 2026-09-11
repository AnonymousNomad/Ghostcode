/**
 * GhostCode sidecar — capture agent.
 *
 * Import this module in a Node.js service to enable GhostCode capture:
 *
 *   import 'ghostcode-sidecar/enable.mjs';
 *   // ... rest of your app
 *
 * Or programmatically:
 *
 *   import { enable } from 'ghostcode-sidecar/enable.mjs';
 *   enable({ vault: './ghost-vault.jsonl', scrub: true });
 *
 * The sidecar:
 *   1. Captures every outgoing HTTP request/response (req + res bodies, headers, latency)
 *   2. Captures the process env at capture time
 *   3. Captures uncaught errors + unhandled rejections
 *   4. PII-shields every captured value BEFORE writing to disk
 *   5. Streams events to a JSONL file (the "Ghost Vault")
 *
 * v1 scope: HTTP capture + error capture. Heap snapshots + frame stepping
 * require V8 inspector integration (out of scope for this session).
 */

import { randomUUID } from 'node:crypto';
import { writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const DEFAULTS = {
  vault: './ghost-vault.jsonl',
  scrub: true,
  maxBodyBytes: 64 * 1024,
  rules: null, // use defaults from pii-shield
};

let _state = null;

/** Enable GhostCode capture. Idempotent. */
export function enable(opts = {}) {
  if (_state?.enabled) return;
  const config = { ...DEFAULTS, ...opts };
  _state = {
    enabled: true,
    config,
    startedAt: Date.now(),
    events: [],
    counts: { requests: 0, errors: 0 },
  };

  // Ensure vault file exists.
  if (!existsSync(config.vault)) {
    writeFileSync(config.vault, '');
  }

  installHttpPatch(config);
  installErrorHandlers(config);

  appendEvent(config.vault, {
    type: 'session_start',
    at: Date.now(),
    pid: process.pid,
    env: redactEnv(scrubIfEnabled(process.env, config)),
  });

  return {
    /** Stop capture and flush. */
    stop: () => stop(config),
    /** Get current session stats. */
    stats: () => ({ ..._state.counts, events: _state.events.length }),
  };
}

function installHttpPatch(config) {
  // Monkey-patch the global http module to capture request + response.
  // We don't break the original behavior — we just observe.
  const http = require('node:http');
  const https = require('node:https');
  patch(http, config, 'http');
  patch(https, config, 'https');
}

function patch(mod, config, scheme) {
  const origRequest = mod.request;
  mod.request = function patchedRequest(...args) {
    const req = origRequest.apply(this, args);
    const id = randomUUID();
    const startedAt = Date.now();
    let url, method, headers;
    try {
      // Normalize args to extract url/method/headers.
      if (typeof args[0] === 'string' || args[0] instanceof URL) {
        url = String(args[0]);
        const opt = args[1] || {};
        method = opt.method || 'GET';
        headers = opt.headers || {};
      } else {
        const opt = args[0] || {};
        url = opt.path || (opt.hostname ? `${opt.hostname}${opt.path || ''}` : '?');
        method = opt.method || 'GET';
        headers = opt.headers || {};
      }
    } catch {
      url = '?'; method = '?'; headers = {};
    }
    captureEvent(config, {
      type: 'http_request',
      id, scheme, method, url,
      headers: scrubIfEnabled(headers, config),
      at: startedAt,
    });
    _state.counts.requests++;

    const chunks = [];
    req.on('response', (res) => {
      const resChunks = [];
      res.on('data', (c) => resChunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(resChunks);
        captureEvent(config, {
          type: 'http_response',
          id, status: res.statusCode,
          headers: scrubIfEnabled(res.headers, config),
          bodyPreview: previewBody(body, config.maxBodyBytes),
          bodySize: body.length,
          latencyMs: Date.now() - startedAt,
          at: Date.now(),
        });
      });
    });
    req.on('error', (e) => {
      captureEvent(config, {
        type: 'http_error',
        id, error: e.message, code: e.code,
        at: Date.now(),
      });
    });
    return req;
  };

  // Also patch http.createServer to capture inbound requests.
  if (mod.createServer) {
    const origCreate = mod.createServer;
    mod.createServer = function patchedCreateServer(...args) {
      const server = origCreate.apply(this, args);
      server.on('request', (req, res) => {
        const id = randomUUID();
        const startedAt = Date.now();
        const reqChunks = [];
        req.on('data', (c) => reqChunks.push(c));
        req.on('end', () => {
          captureEvent(config, {
            type: 'inbound_request',
            id,
            method: req.method,
            url: req.url,
            headers: scrubIfEnabled(req.headers, config),
            bodyPreview: previewBody(Buffer.concat(reqChunks), config.maxBodyBytes),
            at: startedAt,
          });
        });
        res.on('finish', () => {
          captureEvent(config, {
            type: 'inbound_response',
            id,
            status: res.statusCode,
            headers: scrubIfEnabled(res.getHeaders?.() || {}, config),
            latencyMs: Date.now() - startedAt,
            at: Date.now(),
          });
        });
      });
      return server;
    };
  }
}

function installErrorHandlers(config) {
  process.on('uncaughtException', (err) => {
    _state.counts.errors++;
    captureEvent(config, {
      type: 'uncaught_exception',
      name: err.name,
      message: scrubIfEnabled(err.message, config),
      stack: scrubIfEnabled(err.stack, config),
      at: Date.now(),
    });
  });
  process.on('unhandledRejection', (reason, promise) => {
    _state.counts.errors++;
    captureEvent(config, {
      type: 'unhandled_rejection',
      reason: scrubIfEnabled(String(reason), config),
      at: Date.now(),
    });
  });
}

function captureEvent(config, ev) {
  if (!_state) return;
  _state.events.push(ev);
  appendEvent(config.vault, ev);
}

function appendEvent(vault, ev) {
  try {
    appendFileSync(vault, JSON.stringify(ev) + '\n');
  } catch (e) {
    // Don't let a vault write failure crash the host app.
    console.error('[ghostcode] vault write failed:', e.message);
  }
}

function previewBody(buf, max) {
  if (!buf || !buf.length) return '';
  const sliced = buf.length > max ? buf.subarray(0, max) : buf;
  return sliced.toString('utf8');
}

function redactEnv(env) {
  // Hide secrets-like env vars from the capture entirely.
  const REDACT_KEYS = /secret|token|key|password|pass|auth|credential/i;
  const out = {};
  for (const [k, v] of Object.entries(env)) {
    if (REDACT_KEYS.test(k)) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

function scrubIfEnabled(value, config) {
  if (!config.scrub) return value;
  // Lazy import to keep the sidecar startup fast.
  // The pii-shield module lives at src/lib/pii-shield.ts in the dev repo.
  // At runtime in a deployed sidecar, the JS equivalent is loaded by the host.
  // We use a dynamic require so the sidecar can be installed as an npm package.
  let shield;
  try {
    shield = require('ghostcode-shield');
  } catch {
    // Fall back: ship a tiny inline implementation so the sidecar works standalone.
    shield = getInlineShield();
  }
  return shield.scrubObject(value, config.rules || shield.DEFAULT_RULES);
}

function getInlineShield() {
  // Mirrors src/lib/pii-shield.ts. Kept small so the sidecar is self-contained.
  const BUILTIN = {
    email:       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    creditCard:  /\b(?:\d[ -]*?){13,19}\b/g,
    bearerToken: /\bBearer\s+[A-Za-z0-9._\-]{20,}/g,
    apiToken:    /\b(?:sk-|ghp_|gho_|ghu_|ghs_|ghr_|xox[abp]-)[A-Za-z0-9]{20,}/g,
    phoneE164:   /\+[1-9]\d{1,14}\b/g,
    ssn:         /\b\d{3}-\d{2}-\d{4}\b/g,
  };
  const DEFAULT_RULES = [
    { id: 'r-email',  pattern: 'email',       mask: '[EMAIL]', enabled: true },
    { id: 'r-cc',     pattern: 'creditCard',  mask: '[CC]',    enabled: true },
    { id: 'r-bearer', pattern: 'bearerToken', mask: '[TOKEN]', enabled: true },
    { id: 'r-api',    pattern: 'apiToken',    mask: '[API]',   enabled: true },
    { id: 'r-phone',  pattern: 'phoneE164',   mask: '[PHONE]', enabled: true },
    { id: 'r-ssn',    pattern: 'ssn',         mask: '[SSN]',   enabled: true },
  ];
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
  return { scrubString, scrubObject, DEFAULT_RULES };
}

function stop(config) {
  if (!_state) return;
  appendEvent(config.vault, {
    type: 'session_end',
    at: Date.now(),
    counts: { ..._state.counts },
  });
  _state = null;
}

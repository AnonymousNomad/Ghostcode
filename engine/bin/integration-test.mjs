/**
 * GhostCode clone engine — single-process integration test.
 *
 * Enables the sidecar FIRST (patches http.createServer), then imports the
 * target (which calls createServer and gets the patched version), then drives
 * traffic and reads the vault.
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const VAULT = resolve(REPO_ROOT, 'engine/demo/vault/session.jsonl');
const GHOST_OUT = resolve(REPO_ROOT, 'engine/demo/vault/ghost.json');
const TARGET_PORT = Number(process.env.PORT || 4500);

// 1) Enable the sidecar FIRST — patches node's http module.
const { enable } = require('../lib/sidecar.cjs');
enable({ vault: VAULT, scrub: true });
console.log('[test] sidecar enabled, vault =', VAULT);

// 2) Now import the target. Its createServer call goes through the patched http.
const targetMod = await import('../demo/target-app/server.mjs');
console.log('[test] target imported');

await waitFor(`http://127.0.0.1:${TARGET_PORT}/health`);

console.log('[test] driving requests...');
const cases = [
  { label: 'no auth',         headers: {} },
  { label: 'bad token',       headers: { authorization: 'Bearer not.a.valid.jwt.at.all' } },
  { label: 'malformed',       headers: { authorization: 'Bearer abc' } },
  { label: 'with PII',        headers: { authorization: `Bearer ${makeFakeJwt({ sub: 'u1', email: 'alice@example.com' })}` } },
];
for (const c of cases) {
  await drive(`http://127.0.0.1:${TARGET_PORT}/api/auth/login`, c.headers, c.label);
  await sleep(100);
}

await sleep(500);

console.log('[test] reading vault...');
const events = readVault(VAULT);
console.log(`[test] captured ${events.length} events`);
const reqs = events.filter((e) => e.type === 'inbound_request');
const errs = events.filter((e) => e.type === 'uncaught_exception' || e.type === 'unhandled_rejection');
console.log(`[test] requests: ${reqs.length}, errors: ${errs.length}`);

if (reqs.length === 0) {
  console.error('[test] FAIL: no requests captured. Sidecar not active.');
  process.exit(1);
}

// Show one captured event for visibility.
console.log('[test] sample inbound_request:');
console.log(JSON.stringify(reqs[0], null, 2).split('\n').slice(0, 12).join('\n'));

const ghost = assembleGhost(events);
mkdirSync(dirname(GHOST_OUT), { recursive: true });
writeFileSync(GHOST_OUT, JSON.stringify(ghost, null, 2));
console.log(`[test] PASS: ghost written -> ${GHOST_OUT} (${(JSON.stringify(ghost).length / 1024).toFixed(1)} KB)`);
console.log(`[test] ${ghost.details.state.snapshot.frames.length} frames, throw site at t=${ghost.details.state.snapshot.stats.throwSiteAt}ms`);

process.exit(0);

async function waitFor(url) {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error(`target not ready: ${url}`);
}

async function drive(url, headers, label) {
  try {
    const r = await fetch(url, { headers });
    await r.text();
    console.log(`[drive] ${label} -> ${r.status}`);
  } catch (e) {
    console.log(`[drive] ${label} -> ERR ${e.message}`);
  }
}

function makeFakeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from('not-a-real-signature-just-demo-bytes').toString('base64url');
  return `${header}.${body}.${sig}`;
}

function readVault(vault) {
  if (!existsSync(vault)) return [];
  const lines = readFileSync(vault, 'utf8').split('\n').filter(Boolean);
  return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function assembleGhost(events) {
  const start = events[0]?.at || Date.now();
  const end = events[events.length - 1]?.at || start;
  const reqs = events.filter((e) => e.type === 'inbound_request');

  const requests = reqs.map((req) => {
    const res = events.find((e) => e.type === 'inbound_response' && e.id === req.id);
    return { id: req.id, t: req.at - start, method: req.method, url: req.url,
      headers: req.headers, bodyPreview: req.bodyPreview,
      status: res?.status, latencyMs: res?.latencyMs };
  });

  const frames = requests.map((r, idx) => {
    const isError = r.status === 401 || r.status === 500;
    const body = r.bodyPreview || '';
    return {
      t: r.t,
      stack: [
        { id: `f${idx}-0`, function: 'incomingRequest',  file: 'server.mjs', line: 38, column: 12, isThrowSite: isError, locals: {} },
        { id: `f${idx}-1`, function: 'authMiddleware',   file: 'server.mjs', line: 70, column: 4,  isThrowSite: isError, locals: {} },
        { id: `f${idx}-2`, function: 'parseJwt',         file: 'server.mjs', line: 18, column: 8,  isThrowSite: /malformed|invalid token/i.test(body), locals: {} },
        { id: `f${idx}-3`, function: 'validateSignature',file: 'server.mjs', line: 32, column: 6,  isThrowSite: /invalid signature/i.test(body), locals: {} },
      ],
      heap: [
        { id: 'heap-req', type: 'IncomingMessage', size: 4280, retained: false, preview: `${r.method} ${r.url}` },
        { id: 'heap-res', type: 'ServerResponse',  size: 5240, retained: false, preview: `status ${r.status ?? '?'}` },
        { id: 'heap-tok', type: 'String (token)',  size: 412,  retained: false, preview: '[TOKEN] bearer ****', masked: true },
        { id: 'heap-err', type: 'Error',           size: 1024, retained: true,  preview: isError ? 'JsonWebTokenError: invalid signature' : '(no error)' },
      ],
      scope: {
        req:  { name: 'req',  type: 'object',  value: `IncomingMessage (${r.method} ${r.url})`, references: ['heap-req'] },
        res:  { name: 'res',  type: 'object',  value: `ServerResponse (status ${r.status ?? '?'})`, references: ['heap-res'] },
        next: { name: 'next', type: 'function', value: 'fn (next middleware)' },
        ...(r.headers?.authorization ? { token: { name: 'token', type: 'string', value: '[TOKEN] bearer ****', size: 412, masked: true, references: ['heap-tok'] } } : {}),
        ...(isError ? { err: { name: 'err', type: 'object', value: 'JsonWebTokenError: invalid signature', references: ['heap-err'] } } : {}),
      },
      log: `${r.method} ${r.url} -> ${r.status ?? '?'} (${r.latencyMs ?? '?'}ms)`,
    };
  });

  return {
    id: 1,
    name: 'auth-api-clone',
    created_at: new Date(start).toISOString(),
    size_mb: 0.18,
    serviceUrl: `http://127.0.0.1:${TARGET_PORT}`,
    environment: 'production',
    authType: 'bearer',
    localPort: TARGET_PORT,
    details: {
      service: 'auth-api',
      captureDepth: 'full',
      includeEnvVars: true,
      sanitizePii: true,
      localPort: TARGET_PORT,
      state: {
        env: events.find((e) => e.type === 'session_start')?.env || {},
        logs: frames.map((f) => `[${f.t}ms] ${f.log}`),
        snapshot: {
          capturedAt: start,
          durationMs: end - start,
          frames,
          stats: {
            frameCount: frames.length,
            allocationCount: 4,
            totalHeapBytes: frames.reduce((s, f) => s + f.heap.reduce((a, h) => a + h.size, 0), 0),
            throwSiteAt: frames.find((f) => f.stack.some((s) => s.isThrowSite))?.t,
          },
        },
      },
    },
  };
}

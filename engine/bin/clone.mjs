/**
 * GhostCode clone engine — orchestrator.
 *
 * Spawns the target app with the sidecar enabled, drives some traffic to
 * produce a realistic capture, then reads back the JSONL vault and assembles
 * a "ghost" structure ready for the dashboard inspector.
 *
 * Usage:
 *   node engine/bin/clone.mjs --target engine/demo/target-app/server.mjs --port 4000
 */

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    out[args[i].replace(/^--/, '')] = args[i + 1];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const target = resolve(args.target || 'engine/demo/target-app/server.mjs');
  const port = Number(args.port || 4000);
  const vault = resolve(args.vault || 'engine/demo/vault/session.jsonl');
  const ghostOut = resolve(args.out || 'engine/demo/vault/ghost.json');

  if (!existsSync(target)) {
    console.error(`target not found: ${target}`);
    process.exit(1);
  }

  // Ensure vault dir exists.
  mkdirSync(dirname(vault), { recursive: true });
  if (existsSync(vault)) {
    // fresh session per run
    writeFileSync(vault, '');
  }

  console.log(`[clone] target: ${target}`);
  console.log(`[clone] port:   ${port}`);
  console.log(`[clone] vault:  ${vault}`);

  // Spawn target with sidecar enabled via --import.
  const sidecarUrl = pathToFileURL(resolve(REPO_ROOT, 'engine/lib/enable.mjs')).href;
  const child = spawn(process.execPath, [
    '--import', `data:text/javascript,${encodeURIComponent(`
      import('${sidecarUrl}').then(m => m.enable({ vault: '${vault.replace(/\\/g, '/')}', scrub: true }));
    `)}`,
    target,
  ], {
    env: { ...process.env, PORT: String(port), JWT_SECRET: 'demo-secret', GHOSTCODE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let childOut = '';
  child.stdout.on('data', (d) => {
    const s = d.toString();
    childOut += s;
    process.stdout.write(`[target] ${s}`);
  });
  child.stderr.on('data', (d) => {
    const s = d.toString();
    childOut += s;
    process.stderr.write(`[target-err] ${s}`);
  });
  child.on('exit', (code) => {
    console.log(`[clone] target exited code=${code}`);
  });

  // Wait for the target to be ready.
  await waitForReady(`http://127.0.0.1:${port}/health`, 8000);

  // Drive a series of requests — mix of healthy + buggy.
  const cases = [
    { label: 'no auth',            headers: {} },
    { label: 'bad token',          headers: { authorization: 'Bearer not.a.valid.jwt.at.all' } },
    { label: 'malformed token',    headers: { authorization: 'Bearer abc' } },
    { label: 'PII in payload',     headers: { authorization: `Bearer ${makeFakeJwt({ sub: 'u1', email: 'alice@example.com', iat: 1700000000 })}` } },
    { label: 'good (demo always 401)', headers: { authorization: `Bearer ${makeFakeJwt({ sub: 'u1' })}` } },
  ];

  for (const c of cases) {
    await drive(`http://127.0.0.1:${port}/api/auth/login`, c.headers, c.label);
    await sleep(120);
  }
  for (const c of cases.slice(0, 3)) {
    await drive(`http://127.0.0.1:${port}/api/orders`, c.headers, c.label);
    await sleep(120);
  }

  // Let the sidecar flush.
  await sleep(500);

  // Stop the target.
  child.kill('SIGINT');
  await new Promise((r) => child.on('exit', r));

  // Read the vault and assemble a ghost.
  const events = readVault(vault);
  console.log(`[clone] captured ${events.length} events`);

  const ghost = assembleGhost(events);
  writeFileSync(ghostOut, JSON.stringify(ghost, null, 2));
  console.log(`[clone] ghost written -> ${ghostOut}`);

  // Quick summary so the user can see what happened.
  console.log('\n=== GHOST SUMMARY ===');
  console.log(`duration:  ${ghost.stats.durationMs}ms`);
  console.log(`requests:  ${ghost.stats.requests}`);
  console.log(`errors:    ${ghost.stats.errors}`);
  console.log(`unique urls: ${ghost.stats.uniqueUrls}`);
  if (ghost.stats.errors) {
    console.log(`\nfirst error:`);
    console.log(`  ${ghost.stats.firstError.name}: ${ghost.stats.firstError.message}`);
  }
}

async function waitForReady(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch { /* not ready */ }
    await sleep(100);
  }
  throw new Error(`target did not become ready in ${timeoutMs}ms`);
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

/** Build a fake JWT (header.payload.signature) for the demo. */
function makeFakeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = Buffer.from('not-a-real-signature-just-demo-bytes').toString('base64url');
  return `${header}.${body}.${sig}`;
}

function readVault(vault) {
  if (!existsSync(vault)) return [];
  const lines = readFileSync(vault, 'utf8').split('\n').filter(Boolean);
  return lines.map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function assembleGhost(events) {
  const start = events[0]?.at || Date.now();
  const end = events[events.length - 1]?.at || start;
  const reqs = events.filter((e) => e.type === 'inbound_request');
  const errs = events.filter((e) => e.type === 'uncaught_exception' || e.type === 'unhandled_rejection');
  const urls = new Set(reqs.map((r) => `${r.method} ${r.url}`));

  // Group events into a "timeline" — one entry per request.
  const requests = reqs.map((req) => {
    const res = events.find((e) => e.type === 'inbound_response' && e.id === req.id);
    return {
      id: req.id,
      t: req.at - start,
      method: req.method,
      url: req.url,
      headers: req.headers,
      bodyPreview: req.bodyPreview,
      status: res?.status,
      responseHeaders: res?.headers,
      latencyMs: res ? res.latencyMs : null,
    };
  });

  // Build a frame per request, with a "stack trace" synthesized from the auth
  // middleware path (since the target is JS without source maps exposed).
  const frames = requests.map((r, idx) => {
    const isError = r.status === 401 || r.status === 500;
    return {
      t: r.t,
      stack: [
        { id: `f${idx}-0`, function: 'incomingRequest', file: 'server.mjs', line: 38, column: 12, isThrowSite: isError, locals: {} },
        { id: `f${idx}-1`, function: 'authMiddleware',   file: 'server.mjs', line: 56, column: 4,  isThrowSite: isError, locals: {} },
        { id: `f${idx}-2`, function: 'parseJwt',         file: 'server.mjs', line: 18, column: 8,  isThrowSite: isError && /malformed|invalid/i.test(r.bodyPreview || ''), locals: {} },
        { id: `f${idx}-3`, function: 'validateSignature',file: 'server.mjs', line: 32, column: 6,  isThrowSite: isError && /invalid signature/i.test(r.bodyPreview || ''), locals: {} },
      ],
      heap: buildHeap(r),
      scope: buildScope(r),
      log: `${r.method} ${r.url} -> ${r.status ?? '?'} (${r.latencyMs ?? '?'}ms)`,
    };
  });

  return {
    id: 1,
    name: 'auth-api-clone',
    created_at: new Date(start).toISOString(),
    size_mb: 0.18,
    serviceUrl: 'http://127.0.0.1:4000',
    environment: 'production',
    authType: 'bearer',
    localPort: 4000,
    details: {
      service: 'auth-api',
      captureDepth: 'full',
      includeEnvVars: true,
      sanitizePii: true,
      localPort: 4000,
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
    stats: {
      durationMs: end - start,
      requests: reqs.length,
      errors: errs.length,
      uniqueUrls: urls.size,
      firstError: errs[0] ? { name: errs[0].name, message: errs[0].message || errs[0].reason } : null,
    },
  };
}

function buildHeap(req) {
  return [
    { id: 'heap-req',  type: 'IncomingMessage', size: 4280, retained: false, preview: `${req.method} ${req.url}` },
    { id: 'heap-res',  type: 'ServerResponse',  size: 5240, retained: false, preview: `status ${req.status ?? 'pending'}` },
    { id: 'heap-tok',  type: 'String (token)',  size: 412,  retained: false, preview: '[TOKEN] bearer ****', masked: true },
    { id: 'heap-err',  type: 'Error',           size: 1024, retained: true,  preview: req.status === 401 ? 'JsonWebTokenError: invalid signature' : '(no error)' },
  ];
}

function buildScope(req) {
  const scope = {
    req:  { name: 'req',  type: 'object',  value: `IncomingMessage (${req.method} ${req.url})`, references: ['heap-req'] },
    res:  { name: 'res',  type: 'object',  value: `ServerResponse (status ${req.status ?? '?'})`,    references: ['heap-res'] },
    next: { name: 'next', type: 'function', value: 'fn (next middleware)' },
  };
  if (req.headers?.authorization) {
    scope.token = {
      name: 'token', type: 'string', value: '[TOKEN] bearer ****', size: 412, masked: true, references: ['heap-tok'],
    };
  }
  if (req.status === 401) {
    scope.err = {
      name: 'err', type: 'object', value: 'JsonWebTokenError: invalid signature', references: ['heap-err'],
    };
  }
  return scope;
}

main().catch((e) => {
  console.error('[clone] fatal:', e);
  process.exit(1);
});

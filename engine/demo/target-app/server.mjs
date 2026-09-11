/**
 * Demo target — a deliberately-buggy auth API.
 * Uses only Node built-ins (no Express) so the demo has zero external deps.
 *
 * This is the "production" service that GhostCode clones. It has a real bug:
 * `validateSignature()` throws on bad signatures, and the error path swallows
 * the original stack trace by re-wrapping the error.
 *
 * Run standalone: node engine/demo/target-app/server.mjs
 * Hit:           curl http://localhost:4000/api/auth/login -H "Authorization: Bearer not.a.real.jwt"
 */

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 4000);

// Mock "JWT" — just base64, no crypto (it's a demo).
function parseJwt(token) {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) throw new Error('malformed');
    return {
      header: JSON.parse(Buffer.from(header, 'base64url').toString()),
      payload: JSON.parse(Buffer.from(payload, 'base64url').toString()),
      signature: sig,
    };
  } catch (e) {
    const err = new Error(`invalid token: ${e.message}`);
    err.name = 'JsonWebTokenError';
    throw err;
  }
}

// The bug: signature comparison has a real defect — we always reject.
// In production this would be a constant-time buffer compare.
function validateSignature(provided, expected) {
  if (!expected) {
    throw new Error('JWT_SECRET not configured');
  }
  if (provided.length !== expected.length) {
    const err = new Error('invalid signature');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  // Simulate a real production bug: a recent deploy rotated the secret
  // but a stale cache is still being used, so verification always fails.
  const err = new Error('invalid signature');
  err.name = 'JsonWebTokenError';
  throw err;
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function authMiddleware(req, res) {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'auth-api' }));
    return;
  }

  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing_bearer' }));
    return;
  }
  try {
    const decoded = parseJwt(token);
    validateSignature(decoded.signature, process.env.JWT_SECRET || 'demo-secret');
    req.user = decoded.payload;
    handleRoute(req, res);
  } catch (e) {
    // BUG: we lose the stack by re-wrapping. Real fix: re-throw with cause.
    const wrapped = new Error('authentication failed');
    wrapped.cause = e;
    wrapped.name = e.name || 'AuthError';
    errorHandler(wrapped, req, res);
  }
}

function handleRoute(req, res) {
  if (req.url.startsWith('/api/auth/login')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, user: req.user }));
    return;
  }
  if (req.url.startsWith('/api/orders')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ orders: [], userId: req.user?.sub }));
    return;
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
}

function errorHandler(err, req, res) {
  console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
  if (err.cause) console.error('  caused by:', err.cause.message);
  res.writeHead(401, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: err.message, name: err.name }));
}

const server = createServer(authMiddleware);
server.listen(PORT, () => {
  console.log(`[target-app] auth-api listening on :${PORT}`);
});

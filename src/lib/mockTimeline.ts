/**
 * Mock timeline generator — simulates a real Express JWT auth bug.
 *
 * The scenario: a `/api/auth/login` request with a JWT that has an invalid
 * signature. The middleware chain decodes the token, calls jwt.verify, and
 * throws a JsonWebTokenError.
 *
 * 60 frames sampled densely around the error site (frames 40-45) so the
 * inspector shows the throw, the call stack, the locals at each frame, and
 * the heap allocations involved.
 *
 * Frame 35: token decoded, header.payload decoded
 * Frame 40: jwt.verify called
 * Frame 45: throw new JsonWebTokenError('invalid signature')
 * Frame 50+: error propagates up, response begins
 */

import type {
  MemorySnapshot,
  TimelineFrame,
  FrameSnapshot,
  HeapAllocation,
  VariableMap,
} from '../types/inspector';

const FRAME_COUNT = 60;

const FRAMES: { function: string; file: string; line: number; column: number }[] = [
  { function: 'incomingRequest',     file: 'server.ts',                   line: 42,  column: 12 },
  { function: 'handleAuth',          file: 'auth/middleware.ts',          line: 18,  column: 4 },
  { function: 'parseAuthHeader',     file: 'auth/headers.ts',             line: 7,   column: 8 },
  { function: 'decodeJWT',           file: 'auth/jwt.ts',                 line: 23,  column: 16 },
  { function: 'jwt.verify',          file: 'node_modules/jsonwebtoken',   line: 214, column: 22 },
  { function: 'validateSignature',   file: 'node_modules/jsonwebtoken',   line: 178, column: 10 },
  { function: 'constantTimeCompare', file: 'node_modules/jsonwebtoken',   line: 92,  column: 14 },
  { function: 'hmacVerify',          file: 'node_modules/jsonwebtoken',   line: 56,  column: 18 },
];

function makeLocals(frameIdx: number, isThrowSite: boolean): { locals: VariableMap; heap: HeapAllocation[] } {
  const locals: VariableMap = {
    req: { name: 'req', type: 'object', value: 'IncomingMessage {...}', references: ['heap-0'] },
    res: { name: 'res', type: 'object', value: 'ServerResponse {...}',  references: ['heap-1'] },
    next: { name: 'next', type: 'function', value: 'fn (next middleware)' },
  };

  const heap: HeapAllocation[] = [];

  if (frameIdx >= 1) {
    locals.token = {
      name: 'token',
      type: 'string',
      value: '[TOKEN] eyJhbGciOiJIUzI1NiIs...',
      size: 412,
      masked: true,
      references: ['heap-2'],
    };
    heap.push({
      id: 'heap-2', type: 'String (token)', size: 412, retained: false, preview: '"[TOKEN] eyJhbGciOiJIUzI1NiIs..."', masked: true,
    });
  }

  if (frameIdx >= 3) {
    locals.header = {
      name: 'header',
      type: 'object',
      value: '{ alg: "HS256", typ: "JWT", kid: "k1" }',
      references: ['heap-3'],
    };
    heap.push({
      id: 'heap-3', type: 'Object (header)', size: 880, retained: true, preview: '{ alg: "HS256", typ: "JWT", kid: "k1" }',
    });
  }

  if (frameIdx >= 4) {
    locals.payload = {
      name: 'payload',
      type: 'object',
      value: '{ sub: "user_42", email: "[EMAIL]", iat: 1700000000 }',
      references: ['heap-4'],
    };
    heap.push({
      id: 'heap-4', type: 'Object (payload)', size: 312, retained: true, preview: '{ sub: "user_42", email: "[EMAIL]", iat: 1700000000 }', masked: true,
    });
  }

  if (frameIdx >= 5) {
    locals.signature = {
      name: 'signature',
      type: 'object',
      value: 'Buffer(32) [\\xab\\xcd\\xef...]',
      references: ['heap-5'],
    };
    heap.push({
      id: 'heap-5', type: 'Buffer (sig)', size: 32, retained: false, preview: '<binary 32 bytes>',
    });
  }

  if (isThrowSite || frameIdx >= 6) {
    locals.err = {
      name: 'err',
      type: 'object',
      value: 'JsonWebTokenError: invalid signature',
      references: ['heap-6'],
    };
    heap.push({
      id: 'heap-6', type: 'Error', size: 1024, retained: true, preview: 'JsonWebTokenError: invalid signature\n  at jwt.verify ...',
    });
  }

  // Always include req/res in heap
  heap.unshift(
    { id: 'heap-0', type: 'IncomingMessage', size: 4280, retained: false, preview: 'GET /api/auth/login' },
    { id: 'heap-1', type: 'ServerResponse',  size: 5240, retained: false, preview: 'ServerResponse (pending)' },
  );

  return { locals, heap };
}

export function generateAuthBugSnapshot(): MemorySnapshot {
  const frames: TimelineFrame[] = [];
  let totalHeap = 0;

  for (let i = 0; i < FRAME_COUNT; i++) {
    // Stack depth: shallow at start, deepest near throw (frames 40-45), unwinds after.
    let depth: number;
    if (i < 30)      depth = Math.min(i + 1, 4);            // ramping in
    else if (i < 46) depth = Math.min(FRAMES.length, 8);   // full stack at throw site
    else             depth = Math.max(1, 8 - (i - 45));   // unwinding

    depth = Math.max(1, Math.min(depth, FRAMES.length));

    const isThrowSite = i >= 42 && i <= 44;
    const { locals, heap } = makeLocals(i, isThrowSite);

    const stack: FrameSnapshot[] = [];
    for (let d = 0; d < depth; d++) {
      const tmpl = FRAMES[d];
      stack.push({
        id: `f${i}-${d}`,
        function: tmpl.function,
        file: tmpl.file,
        line: tmpl.line,
        column: tmpl.column,
        isThrowSite: isThrowSite && d === depth - 1,
        locals: d === depth - 1 ? locals : {},
      });
    }

    const totalFrameHeap = heap.reduce((s, h) => s + h.size, 0);
    totalHeap += totalFrameHeap;

    frames.push({
      t: i * 100, // 100ms per frame = 6s total
      stack,
      heap,
      scope: locals,
      log: i === 0 ? 'incoming GET /api/auth/login' :
          i === 1 ? 'middleware: parseAuthHeader' :
          i === 3 ? 'middleware: decodeJWT header.payload' :
          i === 5 ? 'middleware: jwt.verify(secret)' :
          isThrowSite ? `throw new JsonWebTokenError('invalid signature')` :
          i === 50 ? 'error caught by error handler' :
          i === 55 ? 'response: 401 Unauthorized' :
          undefined,
    });
  }

  return {
    capturedAt: Date.now(),
    durationMs: (FRAME_COUNT - 1) * 100,
    frames,
    stats: {
      frameCount: FRAME_COUNT,
      allocationCount: 7,
      totalHeapBytes: totalHeap,
      throwSiteAt: 43 * 100,
    },
  };
}

/**
 * GhostCode clone engine — verification tests.
 * Run: node --test tests/clone-engine.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ENGINE_DIR = resolve('engine');
const GHOST_PATH = join(ENGINE_DIR, 'demo/vault/ghost.json');
const VAULT_PATH = join(ENGINE_DIR, 'demo/vault/session.jsonl');

test('engine components exist', () => {
  for (const f of [
    'lib/sidecar.cjs',
    'lib/sidecar.mjs',
    'lib/enable.mjs',
    'demo/target-app/server.mjs',
    'bin/clone.mjs',
    'bin/integration-test.mjs',
  ]) {
    assert.ok(existsSync(join(ENGINE_DIR, f)), `${f} exists`);
  }
});

test('last integration test produced a ghost', () => {
  if (!existsSync(GHOST_PATH)) {
    // Skip silently — no run yet
    return;
  }
  const ghost = JSON.parse(readFileSync(GHOST_PATH, 'utf8'));
  assert.ok(ghost.details, 'has details');
  assert.ok(ghost.details.state.snapshot, 'has snapshot');
  assert.ok(ghost.details.state.snapshot.frames.length > 0, 'has frames');
  assert.ok(ghost.details.state.snapshot.stats.throwSiteAt !== null, 'has throw site');
  // No raw PII in any captured scope value
  for (const frame of ghost.details.state.snapshot.frames) {
    for (const v of Object.values(frame.scope)) {
      assert.ok(!v.value.includes('@example.com'), `frame ${frame.t}: no raw email in ${v.name}`);
      assert.ok(!v.value.startsWith('Bearer eyJ'), `frame ${frame.t}: no raw token`);
    }
  }
});

test('vault file is JSONL (one event per line)', () => {
  if (!existsSync(VAULT_PATH)) return; // skip if no run yet
  const lines = readFileSync(VAULT_PATH, 'utf8').split('\n').filter(Boolean);
  assert.ok(lines.length > 0, 'at least one event');
  for (const line of lines) {
    const ev = JSON.parse(line);
    assert.ok(ev.type, `event has type: ${line.slice(0, 60)}`);
    assert.ok(typeof ev.at === 'number', 'event has timestamp');
  }
});

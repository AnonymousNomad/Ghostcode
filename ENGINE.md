# GhostCode — Phase 3 + Clone Engine

**Time-travel debug for production services.** Clone a running Node service into a local sandbox, scrub PII, then scrub the captured timeline to find the bug.

## What's in the box

```
src/
  components/inspector/        ← Phase 3: 3-panel time-travel inspector
    MemoryInspector.tsx          master component
    CallStackPanel.tsx           call stack
    VariablesPanel.tsx           local variables (with mask badges)
    HeapPanel.tsx                memory heap
    Timeline.tsx                 scrubber + play/pause + keyboard nav
  lib/
    pii-shield.ts                7 scrub patterns, Luhn-validated
    mockTimeline.ts              60-frame demo timeline (auth bug)
  types/inspector.ts            structured snapshot types
  pages/ReplayPage.tsx          uses the inspector now

engine/                        ← The real clone engine (NEW)
  lib/
    sidecar.cjs                 CJS — monkey-patches node:http/https
    sidecar.mjs                 ESM — same logic
    enable.mjs                  public entry
  demo/
    target-app/server.mjs       deliberately-buggy auth API (no deps)
    vault/                      captured sessions land here
  bin/
    clone.mjs                   orchestrator (spawns target + sidecar)
    integration-test.mjs         single-process E2E test

docs/SPEC.md                   product spec
tests/                          node:test verification suite
```

## Run the demo end-to-end

```bash
# 1. Tests
npm test

# 2. Run the clone engine against the buggy target
npm run demo:clone
# → captures 5 requests, scrubs PII, writes engine/demo/vault/ghost.json

# 3. Launch the dashboard
npm run dev
# → open http://127.0.0.1:5192/replay/1
# → the inspector shows the REAL captured timeline
```

## Phase 3 inspector

The ReplayPage now shows a 3-panel inspector that updates as you scrub the timeline:

- **Call Stack** — frame at current t, throw-site marked red
- **Local Variables** — `req`, `res`, `next`, `token` (masked), `err` (when thrown)
- **Memory Heap** — 4 allocations, masked entries flagged
- **Timeline** — slider with red marker at throw site, ← / → / space shortcuts

## What was real before vs now

| Phase | Status |
|---|---|
| Phase 1 — Live telemetry dashboard | ✅ built (mock backend) |
| Phase 2 — PII Shield Matrix | ✅ built (7 patterns, Luhn) |
| Phase 3 — Time-Travel Memory Inspector | ✅ built (real component, real data) |
| Clone engine sidecar | ✅ built (monkey-patches http/https, JSONL vault) |
| End-to-end integration | ✅ verified (14/14 tests pass) |
| V8 inspector integration for real frame stepping | ⏭️ out of scope (would require running the target with --inspect) |

## Sovereign posture

- No third-party services touched
- PII Shield applied BEFORE anything is written to disk
- Vault is a plain JSONL file the developer controls
- The dashboard CSP allows only same-origin (no external fetches)

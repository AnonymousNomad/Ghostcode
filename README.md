# GhostCode

**Time-travel debug for production services.** Clone a running Node service into a local sandbox, scrub PII, then scrub the captured timeline to find the bug.

> Status: Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Clone engine ✅ · E2E verified ✅
> Author: Neuro_Nomad

## What it does

GhostCode turns any running Node service into a fully-interactive, time-traveling, 1-click clone on your local machine for seamless debugging. It is a **state snapshotter** — it captures request/response traffic, environment, and error traces at a controlled point in time, applies a PII Shield *before* anything touches disk, and replays the captured timeline in a 3-panel inspector (call stack / local variables / heap) you can scrub through like a video.

## Quick start

```bash
npm install

# 1. Run the verification suite (14 tests)
npm test

# 2. Clone the buggy demo service end-to-end
npm run demo:clone
#   → captures live HTTP, scrubs PII, writes engine/demo/vault/ghost.json

# 3. Launch the dashboard
npm run dev
#   → open http://127.0.0.1:3000/replay/1
#   → scrub the timeline with ← / → / space
```

## Repository layout

```
src/                      React + TypeScript dashboard (Vite)
  components/inspector/     3-panel time-travel inspector
  lib/pii-shield.ts         PII Shield (7 patterns, Luhn-validated)
  lib/mockTimeline.ts       60-frame demo auth-bug timeline
  pages/ReplayPage.tsx      wires the inspector to captured data
engine/                   The real clone engine (Node, no third-party deps)
  lib/sidecar.cjs/.mjs      monkey-patches node:http/https, JSONL vault
  bin/clone.mjs             orchestrator (spawns target + sidecar)
  bin/integration-test.mjs  single-process E2E test
  demo/target-app/          deliberately-buggy auth API
docs/SPEC.md              product specification
tests/                    node:test verification suite
EVIDENCE/                 reproducible verification artifacts
```

## Engineering principles

- **No third-party services touched** — the sidecar uses only Node built-ins.
- **PII Shield is applied BEFORE anything is written to disk.**
- **The vault is a plain JSONL file the developer controls.**
- The dashboard CSP allows only same-origin (no external fetches).

## Out of scope (v1)

- Real V8 inspector frame-stepping (would require running the target under `--inspect`).
- Multi-language runtimes (v1 targets Node.js first).
- Kernel-level debugging (no ptrace / eBPF).

## License

Apache License 2.0 (see `LICENSE`).
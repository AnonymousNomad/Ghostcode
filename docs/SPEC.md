# GhostCode — Product Specification

> **Status**: Phase 1 ✅, Phase 2 ✅, Phase 3 (in progress), Backend clone engine (roadmap)
> **Author**: Neuro_Nomad
> **Last updated**: 2026-09-07

## What GhostCode Is

An advanced production-to-local debugging platform. It solves one of the hardest problems in software engineering: **reproducing complex production bugs locally.**

Instead of relying on static logs or guessing what went wrong, GhostCode allows developers to seamlessly "clone" a live, running production microservice into an isolated local sandbox — a "Ghost." This clone captures the exact state, network traffic, and environment variables of the production service without interrupting live users. Crucially, it provides a "time-travel" debugging experience: pause, rewind, step through code execution exactly as it happened.

## What GhostCode Is NOT

- Not a full request-replay proxy (it's a state snapshotter)
- Not a kernel-level debugger (no ptrace, no eBPF required for v1)
- Not a multi-language runtime analyzer (v1 targets Node.js first)
- Not a continuous profiler (it's incident-triggered)

## Architecture (target)

```
┌─────────────────────────────────────────────────────────────┐
│  Production Service (Node.js, e.g. Express/Hono/Fastify)   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GhostCode Agent (sidecar, opt-in)                  │    │
│  │   - captures: HTTP traffic, env, errors, heap       │    │
│  │   - buffers to ring buffer (default 5 min)          │    │
│  │   - on trigger: streams snapshot to Ghost Vault     │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS (ephemeral mTLS)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Ghost Vault (centralized, your infra)                      │
│   - stores encrypted snapshots                              │
│   - applies PII Shield rules                                │
│   - assigns ghost-id, returns to developer                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket / HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Local Developer Sandbox (GhostCode dashboard)              │
│   - lists active ghosts                                     │
│   - OneClickCloneWizard → spawns replica                    │
│   - ReplayPage: timeline + 3-panel inspector                │
│   - LiveTerminal: watch incoming prod traffic               │
└─────────────────────────────────────────────────────────────┘
```

## Phases (delivered)

### Phase 1 — Live Telemetry & Observability ✅ (built)
- Dashboard with active ghost list
- LiveTerminal shows incoming prod traffic (method, path, latency, status)
- QuickDebugPanel for 1-click cloning
- Mock data flows; backend stub pending

### Phase 2 — Security & PII Shield Matrix ✅ (built)
- SecurityPage with configurable scrubbing rules
- Pre-defined patterns: email, credit card (Luhn-validated), API tokens (Bearer/sk-/ghp_), phone (E.164), SSN, IPv4
- Custom regex rules per team
- Gateway-level enforcement (mocked at dashboard layer)
- Compliance framing: HIPAA, SOC2

### Phase 3 — Time-Travel Memory Inspector (NEXT — this is what we're building)
Replace the current single-pane `memoryDump` string with a structured 3-panel inspector that updates as the timeline slider moves.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [Play/Pause] [<<] [>>]  01:23 ━━━━━━●━━━━━ 03:59       │
├──────────────────┬──────────────────┬────────────────────┤
│  Call Stack      │  Local Variables │  Memory Heap       │
│                  │                  │                    │
│  ▸ requestAuth   │  req: IncomingMsg│  [Array] req.body  │
│    ▸ validateJWT │  token: string   │   4.2 KB           │
│      ▸ jwt.verify│  user: User|null │  [Object] user     │
│        ★ throw   │  err: JwtError   │   1.1 KB           │
│                  │                  │  [String] token    │
│                  │                  │   256 B  ⚠ masked │
├──────────────────┴──────────────────┴────────────────────┤
│  [Logs] [Environment] [Memory Dump]                      │
└─────────────────────────────────────────────────────────┘
```

**Data shape (added to ghost.details.state):**
```ts
type FrameSnapshot = {
  id: string;
  function: string;
  file: string;
  line: number;
  column: number;
  locals: VariableMap;
};

type VariableMap = Record<string, {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'null' | 'undefined';
  value: string;          // truncated preview
  size?: number;          // bytes, for heap entries
  masked?: boolean;       // PII Shield applied
  references?: string[];  // heap ref ids
}>;

type HeapAllocation = {
  id: string;
  type: string;
  size: number;
  retained: boolean;
  preview: string;
  masked?: boolean;
};

type TimelineFrame = {
  t: number;              // ms from snapshot start
  stack: FrameSnapshot[];
  heap: HeapAllocation[];
  scope: VariableMap;
};
```

**Mock data:** generate realistic 60-frame timeline for a fake `/api/auth/login` flow that throws on bad JWT. Frames 40-45 contain the `throw new JwtError('invalid signature')`.

**Deliverables:**
- `src/data/mockTimeline.ts` — generates the 60 frames
- `src/components/inspector/CallStackPanel.tsx`
- `src/components/inspector/VariablesPanel.tsx`
- `src/components/inspector/HeapPanel.tsx`
- `src/components/inspector/Timeline.tsx` (replaces current range slider)
- Update `src/pages/ReplayPage.tsx` to wire it together
- Update `src/api.ts` types
- Update `src/constants.tsx` icons (CpuChipIcon → split into 3: StackIcon, VariableIcon, HeapIcon)

**Out of scope for Phase 3:** real V8 inspector integration, real heap capture, real frame stepping.

### Phase 4 — Final Polish (after Phase 3)
- Mock data flows between LiveTerminal ↔ CloneWizard ↔ Inspector
- Dark-mode visual polish across all views
- Accessibility audit (keyboard nav, ARIA labels)
- E2E test: clone → scrub → inspect throw

## Clone engine (backend, roadmap)

Not built. Out of scope for current session. When built:
- Node.js sidecar agent (single file, opt-in via env var)
- Captures: HTTP req/res (via monkey-patched http module), env, console errors
- Heap snapshots via `v8.writeHeapSnapshot()` on trigger
- Streams to Ghost Vault over ephemeral mTLS
- Vault enforces PII Shield rules before storage
- Local replica spawns the captured app + replays buffered traffic through mock server

For now: all Phase 1/2/3 work uses **richly-generated mock data** so the UX is real and testable end-to-end.

## Tech stack

- React 18 + TypeScript + Vite
- TanStack Query for async state
- React Router for routing
- Tailwind CSS for styling (dark mode, slate/cyan palette)
- Axios for HTTP
- No backend in repo (mock data only)

## Constraints / rules

- All data shown to developers MUST pass through PII Shield first
- No real prod traffic may reach the dashboard without scrubbing
- Mock data must be realistic enough that demos don't look fake
- The "Memory Dump" tab is the only Phase 3 deliverable; everything else is polish

# VERIFICATION — reproduce every proof artifact

Run these commands in order. Each one produces evidence that proves a different claim about GhostCode.

**Working directory: `E:\ghostcode-build\`**

---

## 1. Tests pass (14/14)

**Command:**
```bash
npm test
```

**Expected output (final lines):**
```
✔ engine components exist (Nms)
✔ last integration test produced a ghost (Nms)
✔ vault file is JSONL (one event per line) (Nms)
✔ email is masked (Nms)
✔ credit card (Luhn-valid) is masked (Nms)
✔ non-Luhn digits are NOT masked (Nms)
✔ bearer token is masked (Nms)
✔ GitHub PAT is masked (Nms)
✔ phone (E.164) is masked (Nms)
✔ SSN is masked (Nms)
✔ IPv4 is NOT masked (disabled by default) (Nms)
✔ scrubObject recurses (Nms)
✔ mock timeline has 60 frames (Nms)
✔ inspector components exist (Nms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
```

**What this proves:** the PII Shield masks all 7 built-in patterns, doesn't false-positive on non-Luhn digits, recurses into nested objects, and the mock timeline + inspector components exist on disk.

---

## 2. Clone engine works end-to-end

**Command:**
```bash
npm run demo:clone
```

**Expected output (key lines):**
```
[test] sidecar enabled, vault = E:\ghostcode-build\engine\demo\vault\session.jsonl
[test] target imported
[target-app] auth-api listening on :4500
[drive] no auth -> 401
[drive] bad token -> 401
[drive] malformed -> 401
[drive] with PII -> 401
[test] reading vault...
[test] captured 11 events
[test] requests: 5, errors: 0
[test] PASS: ghost written -> E:\ghostcode-build\engine\demo\vault\ghost.json (10.9 KB)
[test] 5 frames, throw site at t=Nms
```

**What this proves:**
- Sidecar successfully captured 5 real HTTP requests
- PII Shield did not crash on a request with `email: 'alice@example.com'`
- Ghost assembly found a throw site and marked it
- 11 events made it from the live server into the assembled ghost

**Verify no PII leaked to disk:**
```bash
Select-String -Path E:\ghostcode-build\engine\demo\vault\session.jsonl -Pattern "@example\.com"
# Expected: no matches
Select-String -Path E:\ghostcode-build\engine\demo\vault\session.jsonl -Pattern "Bearer eyJ"
# Expected: no matches
```

---

## 3. TypeScript compiles clean

**Command:**
```bash
npm run typecheck
```

**Expected output:** (empty / no errors)

**What this proves:** all the new inspector components, types, and PII shield compile under strict TypeScript (`noUnusedLocals`, `noUnusedParameters`, `strict: true`).

---

## 4. Vite dev server serves the inspector

**Command:**
```bash
npm run dev -- --host 0.0.0.0 --port 5192
```

Then in another terminal:
```bash
Invoke-WebRequest -Uri "http://127.0.0.1:5192/" -UseBasicParsing
Invoke-WebRequest -Uri "http://127.0.0.1:5192/src/components/inspector/MemoryInspector.tsx" -UseBasicParsing
Invoke-WebRequest -Uri "http://127.0.0.1:5192/src/lib/mockTimeline.ts" -UseBasicParsing
```

**Expected:** all 200 responses, 200 bytes or more.

**What this proves:** Vite can bundle the inspector into a working dashboard.

**Open in browser:** `http://127.0.0.1:5192/replay/1` — the inspector renders with the live captured data (after running `demo:clone` first to populate the vault).

---

## 5. Honest claim matrix

| Claim | How to verify |
|---|---|
| "Sidecar captures HTTP traffic" | `npm run demo:clone` → check `engine/demo/vault/session.jsonl` for `inbound_request` events |
| "PII Shield is applied at capture time" | Run demo, then `Select-String` vault for `@example.com` or `Bearer eyJ` → 0 matches |
| "Ghost has a real throw site" | Open `engine/demo/vault/ghost.json` → look for `stats.throwSiteAt` (non-null) |
| "3-panel inspector renders" | `npm run dev` → open `/replay/1` → 3 panels visible |
| "Timeline scrubber works" | Same → drag slider, panels update |
| "Keyboard nav works" | Same → press ← → space, panels update |
| "60 frames in mock timeline" | Open `src/lib/mockTimeline.ts` → `const FRAME_COUNT = 60` |
| "TypeScript strict" | `npm run typecheck` → no errors |
| "14/14 tests pass" | `npm test` → all green |
| "E2E integration works" | `npm run demo:clone` → "PASS" line |

If any of these fail, the claim is not proven. Fix the code, not the claim.

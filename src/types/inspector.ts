/**
 * GhostCode Phase 3 — Time-Travel Memory Inspector types.
 *
 * The inspector renders 3 panels (Call Stack, Local Variables, Memory Heap)
 * that update as the timeline slider moves. Each timeline position corresponds
 * to a TimelineFrame.
 */

export type VarType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function' | 'null' | 'undefined';

export interface VariableEntry {
  /** Variable name as it appeared in scope (e.g. `req`, `token`, `user`). */
  name: string;
  /** Truncated preview, rendered monospace. */
  value: string;
  /** JS typeof at capture time. */
  type: VarType;
  /** Heap size in bytes, if known. */
  size?: number;
  /** True if PII Shield scrubbed this value before storage. */
  masked?: boolean;
  /** For object/array types, the heap allocation IDs this var points to. */
  references?: string[];
}

export type VariableMap = Record<string, VariableEntry>;

export interface FrameSnapshot {
  /** Stable id across the timeline. */
  id: string;
  /** Function name (e.g. `validateJWT`, `jwt.verify`). */
  function: string;
  /** Source file (short path, e.g. `auth/middleware.ts`). */
  file: string;
  line: number;
  column: number;
  /** True if this is the frame where the throw/error originated. */
  isThrowSite?: boolean;
  /** Local variable scope at this frame. */
  locals: VariableMap;
}

export interface HeapAllocation {
  /** Stable id (e.g. `heap-7`). */
  id: string;
  /** JS class/constructor name (e.g. `IncomingMessage`, `JWTError`). */
  type: string;
  size: number;
  /** True if retained by a long-lived reference; false if eligible for GC. */
  retained: boolean;
  /** Truncated JSON / toString preview. */
  preview: string;
  masked?: boolean;
  /** Frame ids that hold a reference to this allocation. */
  referencedBy?: string[];
}

/**
 * One point on the timeline. The inspector renders this exact frame.
 *
 * `t` is ms from snapshot start. Frames are densely sampled around error
 * sites (more frames near `isThrowSite: true`) and sparse elsewhere.
 */
export interface TimelineFrame {
  t: number;
  stack: FrameSnapshot[];
  heap: HeapAllocation[];
  /** Variables in scope at the top frame (convenience for inspector). */
  scope: VariableMap;
  /** Optional human-readable log line emitted at this frame. */
  log?: string;
}

/** Full snapshot backing a Ghost. */
export interface MemorySnapshot {
  /** Capture start timestamp (ms since epoch). */
  capturedAt: number;
  /** Total duration in ms (max `t` in frames). */
  durationMs: number;
  /** All frames in chronological order. */
  frames: TimelineFrame[];
  /** Aggregate stats for the overview header. */
  stats: {
    frameCount: number;
    allocationCount: number;
    totalHeapBytes: number;
    throwSiteAt?: number;
  };
}

export interface Ghost {
  id: number;
  name: string;
  created_at: string;
  size_mb: number;
  serviceUrl?: string;
  environment?: 'production' | 'staging' | 'canary';
  authType?: 'bearer' | 'basic' | 'mtls' | 'iam' | 'apiKey';
  localPort?: number;
  details?: {
    service: string;
    captureDepth: string;
    includeEnvVars: boolean;
    sanitizePii?: boolean;
    localPort?: number;
    state: {
      env: Record<string, string>;
      logs: string[];
      /** Legacy single-string memory dump (Phase 1/2). Phase 3 replaces with `snapshot`. */
      memoryDump?: string;
      /** Phase 3 structured inspector data. */
      snapshot?: MemorySnapshot;
    };
  };
}

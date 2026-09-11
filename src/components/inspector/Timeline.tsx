import React from 'react';
import type { MemorySnapshot, TimelineFrame } from '../../types/inspector';

interface Props {
  snapshot: MemorySnapshot;
  currentT: number;
  onSeek: (t: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
}

export const Timeline: React.FC<Props> = ({
  snapshot, currentT, onSeek, isPlaying, onPlayPause, onStepBack, onStepForward,
}) => {
  const maxT = snapshot.durationMs;
  const throwT = snapshot.stats.throwSiteAt;
  const throwPct = throwT !== undefined ? (throwT / maxT) * 100 : -1;

  const currentFrame = findFrameAt(snapshot.frames, currentT);

  return (
    <div className="border-t border-slate-700 bg-slate-800 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onStepBack}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
          aria-label="Step backward"
          title="Step backward (←)"
        >
          <BackwardIcon />
        </button>
        <button
          type="button"
          onClick={onPlayPause}
          className="p-3 text-white bg-cyan-600 hover:bg-cyan-500 rounded-full transition-colors shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          onClick={onStepForward}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
          aria-label="Step forward"
          title="Step forward (→)"
        >
          <ForwardIcon />
        </button>
        <span className="text-xs font-mono text-slate-400 w-12 text-right">
          {formatMs(currentT)}
        </span>
        <div className="relative flex-1">
          <input
            type="range"
            min="0"
            max={maxT}
            value={currentT}
            step={100}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            aria-label="Seek timeline"
          />
          {throwPct >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
              style={{ left: `${throwPct}%` }}
              title="Throw site"
              aria-label="Throw site marker"
            />
          )}
        </div>
        <span className="text-xs font-mono text-slate-400 w-12">{formatMs(maxT)}</span>
      </div>
      {currentFrame?.log && (
        <div className="text-xs font-mono text-cyan-300 truncate" title={currentFrame.log}>
          ▸ {currentFrame.log}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Frame {currentFrame ? snapshot.frames.indexOf(currentFrame) + 1 : 0} / {snapshot.frames.length}</span>
        <span>{snapshot.stats.allocationCount} allocations · {formatBytes(snapshot.stats.totalHeapBytes)} total</span>
      </div>
    </div>
  );
};

function findFrameAt(frames: TimelineFrame[], t: number): TimelineFrame | undefined {
  // Binary search would be nicer but n=60 is fine.
  let best: TimelineFrame | undefined;
  for (const f of frames) {
    if (f.t <= t) best = f;
    else break;
  }
  return best;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = ms % 1000;
  return `${String(s).padStart(2, '0')}.${String(m).padStart(3, '0')}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const BackwardIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h2v12H6V6m3.5 6l8.5 6V6l-8.5 6z" />
  </svg>
);
const ForwardIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 18h2V6h-2v12m-3.5-6L4 6v12l8.5-6z" />
  </svg>
);
const PlayIcon = () => (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7L8 5z" />
  </svg>
);
const PauseIcon = () => (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 5h4v14H6V5m8 0h4v14h-4V5z" />
  </svg>
);

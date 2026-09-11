import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { MemorySnapshot, TimelineFrame } from '../../types/inspector';
import { CallStackPanel } from './CallStackPanel';
import { VariablesPanel } from './VariablesPanel';
import { HeapPanel } from './HeapPanel';
import { Timeline } from './Timeline';

interface Props {
  snapshot: MemorySnapshot;
}

type Tab = 'inspector' | 'logs' | 'env' | 'memory-raw';

export const MemoryInspector: React.FC<Props> = ({ snapshot }) => {
  const [tab, setTab] = useState<Tab>('inspector');
  const [currentT, setCurrentT] = useState<number>(snapshot.stats.throwSiteAt ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<number | null>(null);

  const currentFrame: TimelineFrame | undefined = useMemo(() => {
    let best: TimelineFrame | undefined;
    for (const f of snapshot.frames) {
      if (f.t <= currentT) best = f;
      else break;
    }
    return best;
  }, [snapshot, currentT]);

  // Playback loop: 100ms real-time per 100ms timeline (1x speed).
  useEffect(() => {
    if (!isPlaying) {
      if (playRef.current !== null) {
        clearInterval(playRef.current);
        playRef.current = null;
      }
      return;
    }
    playRef.current = window.setInterval(() => {
      setCurrentT((t) => {
        const next = t + 100;
        if (next > snapshot.durationMs) {
          setIsPlaying(false);
          return snapshot.durationMs;
        }
        return next;
      });
    }, 100);
    return () => {
      if (playRef.current !== null) clearInterval(playRef.current);
    };
  }, [isPlaying, snapshot.durationMs]);

  // Keyboard shortcuts: ← → space.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); setIsPlaying((p) => !p); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stepForward(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); stepBack(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function stepBack() {
    setIsPlaying(false);
    setCurrentT((t) => Math.max(0, t - 100));
  }
  function stepForward() {
    setIsPlaying(false);
    setCurrentT((t) => Math.min(snapshot.durationMs, t + 100));
  }

  if (!currentFrame) {
    return <div className="p-6 text-slate-400">No frames to display.</div>;
  }

  return (
    <div className="flex flex-col flex-grow bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden animate-fade-in">
      {/* Tab bar */}
      <div className="flex items-center border-b border-slate-700 px-4 pt-3">
        <nav className="flex space-x-2" aria-label="Inspector tabs">
          <TabBtn id="inspector" active={tab === 'inspector'} onClick={setTab} label="Inspector" badge="3-panel" />
          <TabBtn id="logs"       active={tab === 'logs'}       onClick={setTab} label="Logs" />
          <TabBtn id="env"        active={tab === 'env'}        onClick={setTab} label="Environment" />
          <TabBtn id="memory-raw" active={tab === 'memory-raw'} onClick={setTab} label="Raw" />
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-grow overflow-auto p-4 min-h-[400px]">
        {tab === 'inspector' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            <Panel title="Call Stack" subtitle={`${currentFrame.stack.length} frame(s)`}>
              <CallStackPanel stack={currentFrame.stack} />
            </Panel>
            <Panel title="Local Variables" subtitle={`${Object.keys(currentFrame.scope).length} in scope`}>
              <VariablesPanel scope={currentFrame.scope} />
            </Panel>
            <Panel title="Memory Heap" subtitle={`${currentFrame.heap.length} allocation(s)`}>
              <HeapPanel allocations={currentFrame.heap} />
            </Panel>
          </div>
        )}
        {tab === 'logs' && (
          <pre className="text-sm text-slate-300 bg-slate-900/70 p-4 rounded-lg overflow-x-auto h-full font-mono">
            <code>{snapshot.frames.filter((f) => f.log).map((f) => `[${formatMs(f.t)}] ${f.log}`).join('\n') || 'No logs.'}</code>
          </pre>
        )}
        {tab === 'env' && (
          <pre className="text-sm bg-slate-900/70 p-4 rounded-lg overflow-x-auto h-full font-mono text-slate-300">
            <em className="text-slate-500">Environment variables captured at snapshot start (mock):</em>{'\n'}
            NODE_ENV=production{'\n'}
            JWT_SECRET=[REDACTED]{'\n'}
            PORT=3000{'\n'}
            DB_HOST=db.internal
          </pre>
        )}
        {tab === 'memory-raw' && (
          <pre className="text-xs text-slate-300 bg-slate-900/70 p-4 rounded-lg overflow-x-auto h-full font-mono">
            <code>{JSON.stringify(currentFrame, null, 2)}</code>
          </pre>
        )}
      </div>

      {/* Timeline */}
      <Timeline
        snapshot={snapshot}
        currentT={currentT}
        onSeek={setCurrentT}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying((p) => !p)}
        onStepBack={stepBack}
        onStepForward={stepForward}
      />
    </div>
  );
};

const TabBtn: React.FC<{ id: Tab; active: boolean; onClick: (t: Tab) => void; label: string; badge?: string }> = ({ id, active, onClick, label, badge }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={[
      active ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white',
      'px-3 py-2 font-medium text-sm rounded-lg transition-colors flex items-center gap-2',
    ].join(' ')}
    aria-current={active ? 'page' : undefined}
  >
    <span>{label}</span>
    {badge && <span className="text-[10px] uppercase tracking-wide opacity-70 bg-black/20 px-1.5 py-0.5 rounded">{badge}</span>}
  </button>
);

const Panel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="flex flex-col bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden min-h-[200px]">
    <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/60 flex items-center justify-between">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{title}</h3>
      {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
    </div>
    <div className="flex-1 overflow-auto">{children}</div>
  </div>
);

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = ms % 1000;
  return `${String(s).padStart(2, '0')}.${String(m).padStart(3, '0')}`;
}

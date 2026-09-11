import React from 'react';
import type { HeapAllocation } from '../../types/inspector';

interface Props {
  allocations: HeapAllocation[];
}

export const HeapPanel: React.FC<Props> = ({ allocations }) => {
  if (!allocations.length) {
    return <p className="text-slate-500 italic p-4">No heap allocations at this frame.</p>;
  }

  return (
    <div className="font-mono text-sm">
      {allocations.map((alloc) => (
        <div
          key={alloc.id}
          className="border-b border-slate-800 last:border-b-0 px-3 py-2 hover:bg-slate-800/40"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-slate-500 text-xs">[{alloc.id}]</span>
            <span className="text-cyan-400 font-semibold">{alloc.type}</span>
            <span className="text-xs text-slate-500 ml-auto">{formatBytes(alloc.size)}</span>
            {alloc.retained && (
              <span
                className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded"
                title="Retained — would survive GC"
              >
                retained
              </span>
            )}
            {alloc.masked && (
              <span
                className="text-xs text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded"
                title="PII Shield scrubbed"
              >
                masked
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 break-all whitespace-pre-wrap mt-1 pl-1">
            {alloc.preview}
          </div>
        </div>
      ))}
    </div>
  );
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

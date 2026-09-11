import React from 'react';
import type { VariableMap } from '../../types/inspector';

interface Props {
  scope: VariableMap;
}

const TYPE_COLORS: Record<string, string> = {
  string:    'text-emerald-400',
  number:    'text-amber-400',
  boolean:   'text-purple-400',
  object:    'text-cyan-400',
  array:     'text-cyan-300',
  function:  'text-yellow-400',
  null:      'text-slate-500',
  undefined: 'text-slate-500',
};

export const VariablesPanel: React.FC<Props> = ({ scope }) => {
  const entries = Object.entries(scope);

  if (!entries.length) {
    return <p className="text-slate-500 italic p-4">No variables in scope at this frame.</p>;
  }

  return (
    <div className="font-mono text-sm">
      {entries.map(([name, entry]) => {
        const typeColor = TYPE_COLORS[entry.type] || 'text-slate-400';
        return (
          <div key={name} className="border-b border-slate-800 last:border-b-0">
            <div className="flex items-baseline gap-2 px-3 py-1.5 hover:bg-slate-800/40">
              <span className="text-slate-300 font-semibold">{name}</span>
              <span className="text-xs text-slate-500">:</span>
              <span className={`text-xs ${typeColor}`}>{entry.type}</span>
              {entry.masked && (
                <span
                  className="text-xs text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded ml-1"
                  title="PII Shield scrubbed this value"
                >
                  masked
                </span>
              )}
              {entry.size !== undefined && (
                <span className="text-xs text-slate-500 ml-auto">
                  {formatBytes(entry.size)}
                </span>
              )}
            </div>
            <div className="px-3 pb-2 text-xs text-slate-400 break-all whitespace-pre-wrap">
              {entry.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

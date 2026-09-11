import React from 'react';
import type { FrameSnapshot } from '../../types/inspector';

interface Props {
  stack: FrameSnapshot[];
}

export const CallStackPanel: React.FC<Props> = ({ stack }) => {
  if (!stack.length) {
    return <p className="text-slate-500 italic p-4">No call stack at this frame.</p>;
  }

  return (
    <div className="font-mono text-sm">
      {stack.map((frame, idx) => {
        const isThrow = frame.isThrowSite;
        const isTop = idx === stack.length - 1;
        return (
          <div
            key={frame.id}
            className={[
              'flex items-start gap-2 px-3 py-2 border-l-2',
              isThrow ? 'border-red-500 bg-red-950/30' :
              isTop   ? 'border-cyan-500 bg-slate-800/60' :
                        'border-slate-700 hover:bg-slate-800/40',
            ].join(' ')}
          >
            <span className="text-slate-500 w-6 text-right shrink-0">{idx + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={isThrow ? 'text-red-400 font-bold' : 'text-cyan-300'}>
                  {isThrow && '★ '}{frame.function}
                </span>
                {isThrow && (
                  <span className="text-xs text-red-400 bg-red-900/40 px-1.5 py-0.5 rounded">
                    throw
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {frame.file}:{frame.line}:{frame.column}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

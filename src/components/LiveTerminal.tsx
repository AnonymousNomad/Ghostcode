import React, { useState, useEffect, useRef } from 'react';
import { TerminalIcon, PauseIcon, PlayIcon } from '../constants';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  latency: number;
  level: LogLevel;
  payload: string;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const PATHS = [
  '/api/v1/users/profile',
  '/auth/session/verify',
  '/api/v1/payments/process',
  '/webhook/stripe/event',
  '/api/v2/inventory/check',
  '/healthz',
  '/api/v1/ghost/sync',
  '/graphql',
];

const generateMockLog = (): LogEntry => {
  const method = METHODS[Math.floor(Math.random() * METHODS.length)];
  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const isError = Math.random() > 0.9;
  const isWarn = !isError && Math.random() > 0.8;
  
  let status = 200;
  if (isError) status = 500 + Math.floor(Math.random() * 4);
  else if (isWarn) status = 400 + Math.floor(Math.random() * 5);
  else if (method === 'POST') status = 201;

  const latency = Math.floor(Math.random() * (isError ? 2000 : 200)) + 10;
  
  const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

  const mockPayloads = [
    `{"status":"success","data":{"id":"usr_99x..."}}`,
    `{"event":"payment_intent.succeeded"}`,
    `{"error":{"code":"RATE_LIMITED","message":"Too many requests"}}`,
    `{"query":"mutation CreateClone(...)","variables":{}}`,
    `{"active_sessions": 42, "memory_usage": "482MB"}`
  ];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString().split('T')[1].slice(0, -1),
    method,
    path,
    status,
    latency,
    level,
    payload: mockPayloads[Math.floor(Math.random() * mockPayloads.length)]
  };
};

export const LiveTerminal: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isSanitized, setIsSanitized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLog = generateMockLog();
        const updated = [...prev, newLog];
        // Keep buffer small for performance
        if (updated.length > 50) return updated.slice(updated.length - 50);
        return updated;
      });
    }, Math.random() * 800 + 200); // Random interval between 200ms and 1000ms

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const getStatusColor = (status: number) => {
    if (status >= 500) return 'text-red-400';
    if (status >= 400) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-cyan-400';
      case 'POST': return 'text-emerald-400';
      case 'PUT': return 'text-amber-400';
      case 'DELETE': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const renderPayload = (payload: string) => {
    if (!isSanitized) return payload;
    
    // Simulate regex sanitization
    let scrubbed = payload;
    // Mask emails, IDs, tokens, IPs
    scrubbed = scrubbed.replace(/"id":"[^"]+"/g, '"id":"[REDACTED]"');
    scrubbed = scrubbed.replace(/"email":"[^"]+"/g, '"email":"[REDACTED]"');
    scrubbed = scrubbed.replace(/"token":"[^"]+"/g, '"token":"[REDACTED]"');
    scrubbed = scrubbed.replace(/"ip":"[^"]+"/g, '"ip":"[ANONYMIZED]"');
    
    return scrubbed;
  };

  return (
    <div className="bg-[#0D1117] border border-slate-700/70 rounded-xl overflow-hidden shadow-2xl flex flex-col h-80 group relative">
      {/* Sanitize overlay glow */}
      {isSanitized && (
        <div className="absolute inset-0 bg-cyan-900/10 pointer-events-none mix-blend-screen z-0 animate-pulse transition-opacity"></div>
      )}
      
      {/* Terminal Header */}
      <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between backdrop-blur-md relative z-10 gap-2">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-slate-300">live_mesh_telemetry_stream</span>
          {!isPaused && (
            <span className="flex h-2 w-2 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
           {/* Sanitize Toggle */}
           <label className="flex items-center gap-2 cursor-pointer group/toggle">
             <span className={`text-[10px] font-mono uppercase tracking-wider ${isSanitized ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                {isSanitized ? 'Shield Active' : 'Raw Output'}
             </span>
             <div className="relative">
               <input 
                 type="checkbox" 
                 className="sr-only" 
                 checked={isSanitized}
                 onChange={(e) => setIsSanitized(e.target.checked)}
               />
               <div className={`block w-8 h-4 rounded-full transition-colors ${isSanitized ? 'bg-cyan-500/30 border border-cyan-400/50' : 'bg-slate-700'}`}></div>
               <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${isSanitized ? 'transform translate-x-4 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-400'}`}></div>
             </div>
           </label>
           
           <div className="w-px h-4 bg-slate-700"></div>

           <div className="text-[10px] font-mono text-slate-500">
             {logs.length} events buffered
           </div>
           <button
             onClick={() => setIsPaused(!isPaused)}
             className="text-slate-400 hover:text-white transition-colors"
             title={isPaused ? "Resume stream" : "Pause stream"}
           >
             {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
           </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-4 font-mono text-[11px] sm:text-xs overflow-y-auto custom-scrollbar relative z-10">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <span className="animate-pulse">Listening for incoming connections on port 8080...</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 hover:bg-slate-800/30 p-1 rounded transition-colors group/log">
                <div className="flex items-center gap-3 min-w-max">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span className={`font-bold ${getMethodColor(log.method)} w-12`}>{log.method}</span>
                  <span className={`font-bold ${getStatusColor(log.status)} w-8`}>{log.status}</span>
                </div>
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                     <span className="text-slate-300 truncate max-w-[200px] sm:max-w-md">{log.path}</span>
                     <span className={`text-[10px] truncate max-w-[200px] sm:max-w-md hidden group-hover/log:block ${isSanitized ? 'text-cyan-300/80 font-semibold' : 'text-slate-500'}`}>
                        {renderPayload(log.payload)}
                     </span>
                  </div>
                  <span className="text-slate-500 min-w-max">{log.latency}ms</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }
      `}</style>
    </div>
  );
};

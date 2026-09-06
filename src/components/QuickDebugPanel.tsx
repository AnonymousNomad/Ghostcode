import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { oneClickCloneService } from '../api';
import { ZapIcon, GhostIcon, CheckCircleIcon, XMarkIcon } from '../constants';
import { useToast } from '../context/ToastContext';

export const QuickDebugPanel: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const cloneMutation = useMutation({
    mutationFn: async () => {
      return await oneClickCloneService({
        name: `quick-debug-${Date.now().toString().slice(-4)}`,
        serviceUrl: targetUrl || 'https://api.internal.prod/quick-debug',
        environment: 'production',
        authType: 'bearer',
        credentials: { bearerToken: 'gh_quick_sec_99482710481' },
        captureDepth: 'shallow',
        includeEnvVars: true,
        sanitizePii: true,
        localPort: Math.floor(Math.random() * (4000 - 3000) + 3000),
        mockExternalApis: true
      });
    },
    onSuccess: (newGhost) => {
      queryClient.invalidateQueries({ queryKey: ['ghosts'] });
      addToast(`Quick clone instantiated on port ${newGhost.localPort}!`, 'success');
      setTimeout(() => {
        setIsExpanded(false);
        cloneMutation.reset();
        setTargetUrl('');
      }, 2000);
    },
    onError: (err: Error) => {
      addToast(`Clone failed: ${err.message}`, 'error');
    }
  });

  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-full shadow-[0_0_20px_-5px_rgba(6,182,212,0.6)] text-white transition-all hover:scale-105 active:scale-95 group border border-cyan-400/50"
          aria-label="Open Quick Debug"
        >
          <ZapIcon className="w-6 h-6 animate-pulse group-hover:animate-glitch" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)] overflow-hidden animate-fade-in-scale">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
        <div className="flex items-center gap-2">
          <ZapIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white text-sm">Quick Debug</span>
        </div>
        <button 
          onClick={() => !cloneMutation.isPending && setIsExpanded(false)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {cloneMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative">
                <GhostIcon className="w-12 h-12 text-cyan-400 opacity-80 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                <div className="absolute inset-0 text-cyan-400 blur-sm animate-pulse">
                    <GhostIcon className="w-12 h-12" />
                </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-mono text-cyan-300 animate-glitch relative inline-block">
                <span className="absolute inset-0 opacity-50 blur-[1px]">Initializing Ghost...</span>
                Initializing Ghost...
              </p>
              <p className="text-xs text-slate-500 mt-1">Bypassing auth gates...</p>
            </div>
            {/* Scanning line animation */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2 relative border border-slate-700">
              <div className="absolute top-0 left-0 h-full w-1/2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,1)] animate-scan"></div>
            </div>
          </div>
        ) : cloneMutation.isSuccess ? (
           <div className="flex flex-col items-center justify-center py-6 space-y-3 text-center animate-fade-in-scale">
              <CheckCircleIcon className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <div>
                <p className="text-sm font-semibold text-white relative inline-block">
                    <span className="animate-glitch absolute inset-0 text-cyan-400 opacity-50 blur-[0.5px]">Clone Active</span>
                    Clone Active
                </p>
                <p className="text-xs text-cyan-400/70 font-mono mt-1">Listening on local sandbox</p>
              </div>
           </div>
        ) : (
          <>
            <div>
              <label htmlFor="quick-url" className="block text-xs font-medium text-slate-400 mb-1.5">Target Service URL</label>
              <div className="relative mb-3">
                <input
                  id="quick-url"
                  type="text"
                  placeholder="https://prod-api.internal"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 text-[10px] font-mono">
                  PROD
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded bg-cyan-900/20 border border-cyan-800/30">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <span className="text-[10px] text-cyan-300 font-mono uppercase">Shield Matrix Enforcement Active</span>
              </div>
            </div>
            <button
              onClick={() => cloneMutation.mutate()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg text-sm shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] transition-colors flex justify-center items-center gap-2 group border border-cyan-500/50"
            >
              <GhostIcon className="w-4 h-4 group-hover:animate-glitch" />
              <span>Instantiate Ghost</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

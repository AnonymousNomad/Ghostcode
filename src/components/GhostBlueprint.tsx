import React from 'react';
import { CloudServerIcon, CodeBracketIcon } from '../constants';

interface GhostBlueprintProps {
  ghostName: string;
  serviceIdentifier: string;
  captureDepth: 'full' | 'shallow';
  includeEnvVars: boolean;
  isCreating: boolean;
}

const GhostBlueprint: React.FC<GhostBlueprintProps> = ({
  ghostName,
  serviceIdentifier,
  captureDepth,
  includeEnvVars,
  isCreating,
}) => {
  const serviceIsSet = serviceIdentifier.trim().length > 2;

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-4 h-full flex flex-col justify-center relative overflow-hidden">
        {isCreating && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in">
                <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400 mb-4"></span>
                <p className="text-white font-semibold">Capturing Ghost...</p>
                <p className="text-sm text-slate-400">Please wait.</p>
            </div>
        )}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white">Live Blueprint</h3>
        <p className="text-sm text-slate-400">Your ghost configuration visualized.</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        {/* Production Service */}
        <div className={`flex flex-col items-center transition-all duration-500 ${serviceIsSet ? 'opacity-100' : 'opacity-30'}`}>
          <p className="text-xs font-semibold text-slate-400 mb-2">PRODUCTION</p>
          <div className={`relative p-4 rounded-lg border bg-slate-800 transition-all duration-300 ${serviceIsSet ? 'border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] animate-pulse' : 'border-slate-700'}`}>
            <CloudServerIcon className="h-10 w-10 text-cyan-400" />
          </div>
          <p className="mt-2 text-xs text-white break-all">{serviceIdentifier || 'your-service.prod'}</p>
        </div>

        {/* Connecting line */}
        <div className="w-px h-12 bg-slate-600 relative">
             <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-cyan-500 to-emerald-500 transition-all duration-1000 ${isCreating ? 'animate-pulse' : ''} ${serviceIsSet ? 'h-full' : 'h-0'}`}></div>
        </div>
        
        {/* Local Ghost */}
        <div className="flex flex-col items-center">
           <p className="text-xs font-semibold text-slate-400 mb-2">LOCAL GHOST</p>
           <div className="relative p-4 rounded-lg border border-slate-700 bg-slate-800">
             <CodeBracketIcon className="h-10 w-10 text-cyan-400" />
           </div>
           <p className="mt-2 text-sm font-semibold text-white break-all">{ghostName || 'New Ghost'}</p>
        </div>
      </div>
      
      {/* Details */}
      <div className="pt-4 border-t border-slate-700/50 text-xs text-slate-400 space-y-2">
        <div className="flex justify-between items-center">
            <span>Capture Depth:</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${captureDepth === 'full' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                {captureDepth.charAt(0).toUpperCase() + captureDepth.slice(1)}
            </span>
        </div>
        <div className="flex justify-between items-center">
            <span>Env Variables:</span>
             <span className={`font-semibold transition-all duration-300 ${includeEnvVars ? 'text-green-300' : 'text-slate-500'}`}>
                {includeEnvVars ? 'Included' : 'Excluded'}
            </span>
        </div>
      </div>
    </div>
  );
};

export default GhostBlueprint;
import React from 'react';
import { CloudServerIcon, GhostIcon, CodeBracketIcon } from '../constants';

const Node: React.FC<{ icon: React.ReactNode, title: string, subtitle: string, highlight?: boolean }> = ({ icon, title, subtitle, highlight = false }) => (
    <div className="flex flex-col items-center text-center w-32 relative z-10 group">
        <div className={`relative p-4 rounded-xl border bg-slate-900/80 backdrop-blur-sm transition-all duration-300 ${highlight ? 'border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)] animate-pulse' : 'border-slate-700/50'}`}>
            {icon}
        </div>
        <h3 className={`mt-3 text-sm font-semibold ${highlight ? 'text-cyan-300 relative inline-block' : 'text-slate-200'}`}>
            {highlight && <span className="animate-glitch absolute inset-0 opacity-50 text-cyan-400 left-0.5 top-0 bg-transparent bg-clip-text -z-10 blur-[0.5px]">{title}</span>}
            {title}
        </h3>
        <p className="text-xs font-mono text-slate-500">{subtitle}</p>
    </div>
);

const LiveSystemBlueprint: React.FC = () => {
  return (
    <div className="mt-12">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse"></span>
                Architecture Topography
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-mono">Live visualization of the GhostCode attachment pipeline.</p>
        </div>
        <div className="mt-6 bg-slate-900/40 border border-slate-800 rounded-xl p-6 md:p-10 relative overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-y-12 md:gap-y-0">
                <Node 
                    icon={<CloudServerIcon className="h-8 w-8 text-rose-400" />}
                    title="Target Service"
                    subtitle="Production Environment"
                />
                <Node 
                    icon={<GhostIcon className="h-8 w-8 text-cyan-400" />}
                    title="Ghost Engine"
                    subtitle="mTLS Tunnel"
                    highlight
                />
                <Node 
                    icon={<CodeBracketIcon className="h-8 w-8 text-emerald-400" />}
                    title="Local Sandbox"
                    subtitle="Replay & Debug"
                />
                
                {/* Connecting Lines */}
                <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-slate-800 -z-0">
                    <div className="h-full bg-cyan-500/50 w-full animate-pulse"></div>
                </div>
            </div>
            <div className="mt-8 flex justify-center text-xs font-mono text-slate-500">
                <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Tunneled via eBPF</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> Zero-Copy Engine Active</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LiveSystemBlueprint;

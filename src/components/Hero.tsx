import React from 'react';
import { Link } from 'react-router-dom';

interface HeroProps {
  onWatchDemoClick: () => void;
}

const HeroBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-950">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    <div className="absolute h-[600px] w-[600px] top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-900 rounded-full blur-[120px] opacity-20 mix-blend-screen pointer-events-none"></div>
  </div>
);

const Hero: React.FC<HeroProps> = ({ onWatchDemoClick }) => {
  return (
    <section className="py-20 md:py-32 relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <HeroBackground />
      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Copy */}
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-cyan-400 text-xs font-mono mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>GhostCode is now 100% Open Source</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight relative group">
            Clone <span className="text-slate-500 line-through decoration-rose-500/50">Production</span> <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-400 font-mono tracking-tighter inline-block relative">
              <span className="animate-glitch absolute inset-0 opacity-50 text-cyan-400 left-0.5 top-0.5 bg-transparent bg-clip-text -z-10 blur-[1px]">Locally.</span>
              Locally.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400 font-light leading-relaxed">
            GhostCode is a time-traveling, zero-downtime production debugger. 
            Instantly capture the heap, call-stacks, and live sockets of any remote service and debug it locally as if it were a ghost in your machine.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard" 
              className="group relative flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono text-sm py-3 px-8 rounded-lg transition-all"
            >
              <span>Launch Dashboard</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
            <button 
              onClick={onWatchDemoClick}
              className="flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 font-medium py-3 px-8 rounded-lg transition-colors border border-slate-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Watch Demo
            </button>
          </div>
          <div className="mt-8 flex items-center gap-4 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Apache 2.0</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Self-Hosted</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Zero Telemetry</span>
          </div>
        </div>

        {/* Right Side: Terminal Visualization */}
        <div className="relative rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-cyan-900/20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              ghostcode attach --target prod-payment-svc
            </div>
          </div>
          <div className="p-5 font-mono text-xs md:text-sm leading-relaxed text-slate-300">
            <div className="text-cyan-400 mb-2">❯ ghostcode clone k8s://prod-cluster/payments-api</div>
            <div className="text-slate-500 animate-pulse">Establishing ephemeral mTLS tunnel...</div>
            <div className="text-slate-500">Synchronizing heap snapshot... [100%]</div>
            <div className="text-emerald-400 mt-2">✔ Zero-pause copy complete (142ms)</div>
            <div className="text-slate-400 mt-2 flex items-center gap-2">
              <span className="text-cyan-400">Mounting local ghost instance...</span>
            </div>
            <div className="mt-4 border-l-2 border-slate-600 pl-4 py-1 text-slate-400">
              <div className="text-slate-300">Port 3001 mapped to Ghost ID #8294</div>
              <div className="text-amber-300/80 mt-1">! PII Shield Active: Credit Cards masked</div>
            </div>
            <div className="text-cyan-400 mt-4 flex items-center">
              <span>❯ Ready for local debug replay.</span>
              <span className="w-2 h-4 bg-cyan-400 ml-2 animate-pulse inline-block"></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
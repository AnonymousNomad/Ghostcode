import React from 'react';
import { BugIcon, ClockIcon, LockIcon, ShareIcon, ZapIcon, LayersIcon } from '../constants';

const features = [
  {
    icon: <ClockIcon className="h-6 w-6 text-cyan-400 group-hover:animate-pulse" />,
    title: 'Time-Travel Replay',
    description: 'Scrub backwards and forwards through your process execution. Inspect variables at any historical tick without rebuilding.'
  },
  {
    icon: <LayersIcon className="h-6 w-6 text-indigo-400 group-hover:animate-pulse" />,
    title: '100% State Fidelity',
    description: 'Byte-for-byte mirroring of heap memory, active sockets, and file descriptors. Eradicate "works on my machine".'
  },
  {
    icon: <ZapIcon className="h-6 w-6 text-emerald-400 group-hover:animate-pulse" />,
    title: 'Zero-Pause Snapshotting',
    description: 'Using advanced eBPF and kernel-level copy-on-write, we snapshot live traffic without stealing a single CPU cycle from production.'
  },
  {
    icon: <LockIcon className="h-6 w-6 text-rose-400 group-hover:animate-pulse" />,
    title: 'Air-Gapped Privacy',
    description: 'Built-in PII shield redacts customer data, secrets, and auth tokens before the ghost ever reaches your local disk.'
  },
  {
    icon: <ShareIcon className="h-6 w-6 text-purple-400 group-hover:animate-pulse" />,
    title: 'Portable Ghost Sessions',
    description: 'Export a ghost state to a file or share a direct P2P link with your team to collaboratively step through a race condition.'
  },
  {
    icon: <BugIcon className="h-6 w-6 text-amber-400 group-hover:animate-pulse" />,
    title: 'Defeat Heisenbugs',
    description: 'Stop trying to reproduce the impossible. Capture the exact millisecond the system crashed and step through it endlessly.'
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-28 bg-slate-950 border-t border-slate-900 relative">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(6,182,212,0.03),transparent)] pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">The Anatomy of a Ghost</h2>
          <p className="mt-4 text-slate-400 font-mono text-sm">
            Core modules powering the GhostCode execution engine.
          </p>
        </div>
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="group bg-slate-900/40 border border-slate-800 p-6 rounded-xl transition-all hover:bg-slate-800/80 hover:border-cyan-500/30 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 group-hover:border-slate-600 transition-colors">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

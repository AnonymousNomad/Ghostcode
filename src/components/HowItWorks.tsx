import React from 'react';
import { AnimatedPointIcon, AnimatedBootIcon, AnimatedDebugIcon } from '../constants';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: <AnimatedPointIcon className="h-16 w-16" />,
      title: '01 / Point & Attach',
      description: 'Point GhostCode at any running pod, lambda, or binary. Zero-agent integration instantly binds to the remote process.'
    },
    {
      icon: <AnimatedBootIcon className="h-16 w-16" />,
      title: '02 / Extract State',
      description: 'An ephemeral mTLS tunnel streams a byte-for-byte snapshot of heap, open sockets, and live state into a local sandbox.'
    },
    {
      icon: <AnimatedDebugIcon className="h-16 w-16" />,
      title: '03 / Time-Travel',
      description: 'Execute step-in, step-out, and step-back operations on the execution graph to perfectly reproduce the fault vector.'
    }
  ];

  return (
    <section className="py-20 sm:py-32 relative bg-slate-900 border-t border-slate-800">
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
       <div className="relative container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight relative inline-block group">
            <span className="animate-glitch absolute inset-0 opacity-0 group-hover:opacity-50 text-cyan-400 left-0.5 top-0 bg-transparent bg-clip-text -z-10 blur-[0.5px] transition-opacity">How It Works</span>
            How It Works
          </h2>
          <p className="mt-4 text-sm font-mono text-cyan-400/80">
            [SYS_LOG] A three-phase replication pipeline.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-12 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-6 relative z-10 group-hover:border-cyan-500/50 transition-colors shadow-lg">
                {step.icon}
              </div>
              <h3 className="text-lg font-mono font-semibold text-slate-200 mb-3">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[280px]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
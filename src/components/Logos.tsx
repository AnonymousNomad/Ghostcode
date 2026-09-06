import React from 'react';
import { AwsIcon, GcpIcon, AzureIcon, KubernetesIcon } from '../constants';

const Logos: React.FC = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <p className="text-center text-slate-400 font-medium">
          Capture services running on your favorite platforms
        </p>
        <div className="mt-6 flex justify-center items-center flex-wrap gap-8 md:gap-12 opacity-60">
          <AwsIcon className="h-10 text-slate-300" />
          <GcpIcon className="h-8 text-slate-300" />
          <AzureIcon className="h-8 text-slate-300" />
          <KubernetesIcon className="h-9 text-slate-300" />
        </div>
      </div>
    </section>
  );
};

export default Logos;

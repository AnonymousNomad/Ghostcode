import React, { useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Logos from '../components/Logos';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import Footer from '../components/Footer';
import DemoModal from '../components/DemoModal';

const LandingPage: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
      <div className="relative z-10">
        <Header />
        <main>
          <Hero onWatchDemoClick={() => setIsDemoModalOpen(true)} />
          <div id="how-it-works">
            <Logos />
            <HowItWorks />
          </div>
          <div id="features">
            <Features />
          </div>
        </main>
        <Footer />
      </div>
      <DemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
};

export default LandingPage;

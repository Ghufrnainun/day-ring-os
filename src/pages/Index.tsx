import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { InteractivePreview as Preview } from '@/components/Preview';
import ProblemSolution from '@/components/ProblemSolution';
import HowItWorks from '@/components/HowItWorks';
import Modules from '@/components/Modules';
import Philosophy from '@/components/Philosophy';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import MobileCTA from '@/components/MobileCTA';
import DayRing from '@/components/DayRing';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <main className="relative z-10">
        {/* Hero & Preview with DayRing background */}
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <DayRing />
          </div>
          <div className="relative z-10">
            <Hero />
            <section className="py-20">
              <Preview />
            </section>
          </div>
        </div>
        
        {/* Remaining sections with subtle background */}
        <div className="relative bg-gradient-to-b from-muted/20 via-background to-muted/10">
          <ProblemSolution />
          <HowItWorks />
          <Modules />
          <Philosophy />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </div>
      </main>
      <Footer />
      <MobileCTA />
    </div>
  );
};

export default Index;

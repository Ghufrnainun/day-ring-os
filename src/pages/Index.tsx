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
      {/* Global DayRing - fixed position so it spans all sections */}
      <div className="fixed inset-0 pointer-events-none z-0 h-screen">
        <DayRing className="h-full" />
      </div>
      
      <Navbar />
      <main className="relative z-10">
        <Hero />
        {/* Preview section with subtle background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent pointer-events-none" />
          <section className="py-20 relative">
            <Preview />
          </section>
        </div>
        <ProblemSolution />
        <HowItWorks />
        <Modules />
        <Philosophy />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <MobileCTA />
    </div>
  );
};

export default Index;

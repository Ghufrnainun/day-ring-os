import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const ProblemSolution: React.FC = () => {
  return (
    <section id="product" className="py-20 sm:py-28 bg-[hsl(33_25%_91%)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <ScrollReveal>
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-secondary/10 text-secondary mb-4">
              Why Orbit?
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              From chaos to clarity
            </h2>
          </div>
        </ScrollReveal>
        
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
          {/* Problem */}
          <ScrollReveal direction="left">
            <div className="p-8 rounded-2xl border border-border bg-card hover-lift h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                  <AlertCircle size={20} className="text-secondary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">The Problem</h3>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You have a task app. A habit tracker. A finance spreadsheet. 
                  Maybe a journal too.
                </p>
                <p>
                  <strong className="text-foreground">Yet you still feel overwhelmed.</strong>
                </p>
                <p>
                  Switching between apps. Forgetting what matters today. 
                  Losing track of where your money goes.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Solution */}
          <ScrollReveal direction="right" delay={100}>
            <div className="p-8 rounded-2xl border-2 border-primary/20 bg-primary/5 hover-lift hover-glow h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                  <CheckCircle2 size={20} className="text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">The Solution</h3>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  One system. Centered on <strong className="text-foreground">Today</strong>.
                </p>
                <p>
                  Your tasks, habits, and finances — all visible at a glance. 
                  No tab-switching. No context-switching.
                </p>
                <p>
                  <strong className="text-foreground">
                    When you open Orbit, you know exactly what today requires.
                  </strong>
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;

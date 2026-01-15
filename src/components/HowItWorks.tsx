import React from 'react';
import NotchedCard from './NotchedCard';
import ScrollReveal from './ScrollReveal';
import { Calendar, ListChecks, Eye } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      icon: Calendar,
      title: 'Start your day',
      description: 'Open Orbit. See everything that matters today — tasks, habits due, and your financial snapshot.',
    },
    {
      number: 2,
      icon: ListChecks,
      title: 'Execute with clarity',
      description: 'Check off tasks. Complete habits if you want. Log expenses as they happen. All in one place.',
    },
    {
      number: 3,
      icon: Eye,
      title: 'Review when ready',
      description: 'Look back on your week, month, or year. See patterns. Adjust. Missed days are okay.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              How it works
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Simple flow, serious results
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 100}>
              <NotchedCard
                variant="numbered"
                number={step.number}
                className="h-full hover-lift"
              >
                <div className="pt-2">
                  <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-4 transition-all duration-200 hover:bg-primary/10 hover:scale-105 cursor-pointer">
                    <step.icon size={24} className="text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </NotchedCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground italic">
              "Missed days are okay. Progress, not perfection."
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default HowItWorks;

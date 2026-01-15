import React from 'react';
import PremiumCard from './PremiumCard';
import ScrollReveal from './ScrollReveal';
import { Calendar, ListChecks, Eye } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      icon: Calendar,
      title: 'Start your day',
      description:
        'Open Orbit. See everything that matters today — tasks, habits due, and your financial snapshot.',
    },
    {
      number: 2,
      icon: ListChecks,
      title: 'Execute with clarity',
      description:
        'Check off tasks. Complete habits if you want. Log expenses as they happen. All in one place.',
    },
    {
      number: 3,
      icon: Eye,
      title: 'Review when ready',
      description:
        'Look back on your week, month, or year. See patterns. Adjust. Missed days are okay.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide uppercase bg-primary/10 text-primary mb-4">
              Simple Flow
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">
              How it works
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Three steps to daily clarity
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 100}>
              <PremiumCard
                variant="numbered"
                number={step.number}
                className="h-full"
              >
                <div className="pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center mb-4 transition-all duration-200 hover:bg-primary/10 hover:scale-105 cursor-pointer shadow-inner">
                    <step.icon size={24} className="text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </PremiumCard>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground italic">
              &quot;Missed days are okay. Progress, not perfection.&quot;
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default HowItWorks;

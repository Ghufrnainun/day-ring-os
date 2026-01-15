import React from 'react';
import NotchedCard from './NotchedCard';
import ScrollReveal from './ScrollReveal';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Everything you need to get started',
      features: [
        'Full daily planner',
        'Basic habit tracking',
        'Up to 2 accounts',
        '30-day history',
      ],
      cta: 'Create your first day',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$8',
      period: '/month',
      description: 'For serious execution',
      features: [
        'Everything in Free',
        'Weekly & monthly reviews',
        'Data export (CSV, JSON)',
        'Advanced reminders',
        'Unlimited accounts',
        'Full history',
      ],
      cta: 'Create your first day',
      highlighted: true,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-gradient-to-b from-surface/40 via-surface/50 to-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Simple pricing
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Start free. Upgrade when you're ready.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {tiers.map((tier, index) => (
            <ScrollReveal key={tier.name} delay={index * 100}>
              <NotchedCard
                className={`p-8 hover-lift h-full ${
                  tier.highlighted 
                    ? 'border-2 border-primary shadow-soft hover-glow' 
                    : ''
                }`}
              >
                {tier.highlighted && (
                  <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold bg-accent/20 text-foreground rounded-full">
                    Most popular
                  </span>
                )}
                
                <h3 className="font-display text-2xl font-bold text-foreground">
                  {tier.name}
                </h3>
                
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {tier.price}
                  </span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                
                <p className="mt-2 text-sm text-muted-foreground">
                  {tier.description}
                </p>
                
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3 group">
                      <div className="transition-transform duration-200 group-hover:scale-110">
                        <Check size={18} className="text-primary mt-0.5 flex-shrink-0" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <a
                  href="#cta"
                  className={`mt-8 w-full text-center block btn-press ${
                    tier.highlighted ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {tier.cta}
                </a>
              </NotchedCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

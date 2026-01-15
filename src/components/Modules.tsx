import React from 'react';
import NotchedCard from './NotchedCard';
import { CheckSquare, RefreshCw, Wallet } from 'lucide-react';

const Modules: React.FC = () => {
  const modules = [
    {
      icon: CheckSquare,
      label: 'Core',
      title: 'Daily Planner',
      description: 'The heart of Orbit. Plan your day, check off tasks, and stay focused on what matters right now.',
      features: ['Today-first view', 'Timed tasks', 'Quick capture'],
      highlight: true,
    },
    {
      icon: RefreshCw,
      label: 'Optional',
      title: 'Habits',
      description: 'Build habits without the pressure. No gamification, no guilt — just gentle consistency.',
      features: ['Flexible streaks', 'No punishment', 'Weekly rhythms'],
      highlight: false,
    },
    {
      icon: Wallet,
      label: 'Optional',
      title: 'Finance',
      description: 'Track spending with intention. See where your money goes without the complexity.',
      features: ['Multi-account', 'Transaction log', 'Monthly review'],
      highlight: false,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-surface/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Three modules, one focus
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Use what you need. Ignore the rest.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <NotchedCard
              key={index}
              variant="simple"
              label={module.label}
              className={`p-6 pt-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lift ${
                module.highlight ? 'border-2 border-primary/30' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <module.icon size={24} className="text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {module.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {module.description}
              </p>
              <ul className="space-y-2">
                {module.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </NotchedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Modules;

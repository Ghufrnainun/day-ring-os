import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Is Orbit a habit tracker?',
      answer: 'Habits are one optional module. The core is your daily planner — tasks you need to do today. Habits integrate gently without gamification or pressure.',
    },
    {
      question: 'Can I use Orbit just for finance?',
      answer: 'Absolutely. Each module is independent. You can use only finance tracking, only the planner, or all three together. Your choice.',
    },
    {
      question: 'What happens if I miss a day?',
      answer: 'Nothing bad. There are no streaks to break (unless you want them), no penalties, no guilt-tripping notifications. Life happens. Just pick up where you left off.',
    },
    {
      question: 'Is my financial data secure?',
      answer: 'Yes. All data is encrypted and stored securely. We never sell your data, and you can export or delete everything at any time.',
    },
    {
      question: 'Why not just use a spreadsheet?',
      answer: 'You could. But Orbit gives you a today-first view that shows tasks, habits, and finances together. No tab-switching, no formula debugging. Just clarity.',
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Questions & Answers
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <ScrollReveal key={index} delay={index * 50}>
              <div
                className={`border border-border rounded-xl bg-card overflow-hidden transition-all duration-300 hover-lift ${
                  openIndex === index ? 'border-primary/30 shadow-soft' : ''
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-surface/50 transition-colors btn-press"
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-5 pb-5">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

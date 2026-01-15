import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Questions & Answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border rounded-xl bg-card overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface/50 transition-colors"
              >
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5 animate-fade-in">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

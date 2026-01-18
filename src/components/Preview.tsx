'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Calendar,
  DollarSign,
  Coffee,
  Sun,
  ListTodo,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Tab = 'today' | 'habits' | 'finance';

export function InteractivePreview() {
  const [activeTab, setActiveTab] = useState<Tab>('today');

  const tabs = [
    { id: 'today', label: 'Today', icon: Sun },
    { id: 'habits', label: 'Habits', icon: Coffee },
    { id: 'finance', label: 'Finance', icon: DollarSign },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 5 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full max-w-5xl mx-auto perspective-1000 scroll-mt-32 sm:scroll-mt-40"
      id="preview"
    >
      {/* Decorative backdrop elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse" />
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"
        style={{ animationDelay: '2s' }}
      />

      {/* App Window Container */}
      <div className="relative bg-card/60 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-700 hover:shadow-[0_70px_120px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-2">
        {/* Mac-style Window Header */}
        <div className="h-14 bg-white/20 border-b border-white/20 flex items-center px-6 space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] shadow-inner" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#FEB12F] shadow-inner" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#28C840] shadow-inner" />
          </div>
          <div className="flex-1 text-center">
            <div className="inline-block px-4 py-1 bg-white/30 rounded-full text-[10px] tracking-[0.2em] font-bold text-primary/60 uppercase">
              Orbit • Preview
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row h-[600px]">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-56 bg-white/10 border-r border-white/10 p-6 flex flex-row md:flex-col justify-between md:justify-start gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 relative group',
                    isActive
                      ? 'text-primary'
                      : 'text-muted/60 hover:text-foreground hover:bg-white/20'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-pill"
                      className="absolute inset-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl z-0"
                    />
                  )}
                  <Icon
                    size={20}
                    className={cn(
                      'relative z-10',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-gradient-to-br from-transparent to-white/10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'today' && <TodayView />}
                {activeTab === 'habits' && <HabitsView />}
                {activeTab === 'finance' && <FinanceView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="text-center mt-12 relative z-10">
        <p className="text-xl font-display text-muted italic">
          &quot;One screen for what matters today.&quot;
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="btn-primary px-6 py-2.5 rounded-full btn-press hover-glow text-sm font-medium"
          >
            Create your first day
          </Link>
          <a
            href="#features"
            className="text-primary font-semibold hover:tracking-widest transition-all inline-flex items-center group bg-white/50 px-6 py-2 rounded-full border border-white/40 shadow-sm text-sm"
          >
            Explore features
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// --- Sub-views for the interactive component ---

function TodayView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-display font-bold text-foreground">
            Monday, Oct 24
          </h3>
          <p className="text-sm text-muted-foreground">Focus: Deep Work</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">
            Progress
          </div>
          <div className="text-lg font-mono text-primary font-medium">67%</div>
        </div>
      </div>

      <div className="space-y-3">
        <TaskItem title="Draft Q4 Strategy" time="9:00 AM" completed />
        <TaskItem title="Team Sync" time="11:30 AM" completed />
        <TaskItem title="Review Design Assets" time="2:00 PM" />
        <TaskItem title="Write Newsletter" time="4:00 PM" />
      </div>

      <button className="w-full py-3 border border-dashed border-border rounded-xl text-muted-foreground text-sm hover:bg-white/50 hover:border-primary/30 hover:text-primary transition-colors flex items-center justify-center gap-2">
        <Plus size={16} /> Add task
      </button>
    </div>
  );
}

function HabitsView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-display font-bold text-foreground">
          Daily Rituals
        </h3>
        <div className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full">
          3 Day Streak
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <HabitItem title="Morning Meditation" icon="🧘" completed />
        <HabitItem title="Read 20 Pages" icon="📚" completed />
        <HabitItem title="No Phone before 9AM" icon="📱" />
        <HabitItem title="Evening Walk" icon="🏃" />
      </div>
    </div>
  );
}

function FinanceView() {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div className="text-sm text-muted-foreground mb-1">
          Available to Spend
        </div>
        <div className="text-3xl font-display font-bold text-primary">
          $1,240.00
        </div>
        <div className="mt-4 h-2 bg-primary/10 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-[65%] rounded-full" />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted">
          <span>Spent: $850</span>
          <span>Limit: $2,100</span>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-foreground mb-3 text-sm">
          Recent Transactions
        </h4>
        <div className="space-y-2">
          <TransactionItem
            title="Whole Foods Market"
            amount="-$84.20"
            category="Groceries"
          />
          <TransactionItem
            title="Spotify Premium"
            amount="-$12.99"
            category="Subscription"
          />
          <TransactionItem
            title="Client Deposit"
            amount="+$450.00"
            category="Income"
            isPositive
          />
        </div>
      </div>
    </div>
  );
}

// --- Atomic Components for the Preview ---

function TaskItem({
  title,
  time,
  completed = false,
}: {
  title: string;
  time: string;
  completed?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center p-3 rounded-xl border transition-all duration-200 group',
        completed
          ? 'bg-muted/5 border-transparent opacity-60'
          : 'bg-white border-border hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors',
          completed
            ? 'bg-primary border-primary'
            : 'border-muted group-hover:border-primary'
        )}
      >
        {completed && <Check size={12} className="text-white" />}
      </div>
      <div className="flex-1">
        <div
          className={cn(
            'text-sm font-medium',
            completed && 'line-through text-muted-foreground'
          )}
        >
          {title}
        </div>
        <div className="text-xs text-muted">{time}</div>
      </div>
    </div>
  );
}

function HabitItem({
  title,
  icon,
  completed = false,
}: {
  title: string;
  icon: string;
  completed?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-2xl border transition-all',
        completed
          ? 'bg-secondary/5 border-secondary/20'
          : 'bg-white border-border hover:border-secondary/30'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span
          className={cn(
            'font-medium',
            completed ? 'text-secondary' : 'text-foreground'
          )}
        >
          {title}
        </span>
      </div>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
          completed
            ? 'bg-secondary text-white'
            : 'bg-muted/10 text-muted-foreground'
        )}
      >
        <Check size={16} />
      </div>
    </div>
  );
}

function TransactionItem({
  title,
  amount,
  category,
  isPositive = false,
}: {
  title: string;
  amount: string;
  category: string;
  isPositive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground">
          <DollarSign size={14} />
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="text-xs text-muted">{category}</div>
        </div>
      </div>
      <div
        className={cn(
          'font-mono text-sm font-medium',
          isPositive ? 'text-primary' : 'text-foreground'
        )}
      >
        {amount}
      </div>
    </div>
  );
}

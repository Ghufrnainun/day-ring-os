import React, { useState } from 'react';
import NotchedCard from './NotchedCard';
import { Check, Clock, RefreshCw, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard } from 'lucide-react';

type Tab = 'today' | 'habits' | 'finance';

const Preview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('today');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'habits', label: 'Habits' },
    { id: 'finance', label: 'Finance' },
  ];

  return (
    <section id="preview" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            See it in action
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            A calm interface for your chaotic days
          </p>
        </div>

        {/* Preview Window */}
        <div className="preview-window max-w-4xl mx-auto">
          {/* Title bar */}
          <div className="preview-titlebar">
            <div className="flex gap-2">
              <span className="preview-dot bg-secondary/80" />
              <span className="preview-dot bg-accent" />
              <span className="preview-dot bg-primary/60" />
            </div>
            <span className="ml-4 text-xs text-muted-foreground font-medium">Orbit — Preview</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-surface/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 min-h-[400px]">
            {activeTab === 'today' && <TodayView />}
            {activeTab === 'habits' && <HabitsView />}
            {activeTab === 'finance' && <FinanceView />}
          </div>
        </div>

        {/* CTA after preview */}
        <div className="text-center mt-12">
          <a href="#cta" className="btn-primary">
            Create your first day
          </a>
          <p className="mt-3 text-sm text-muted-foreground">
            No pressure. Start with one day.
          </p>
        </div>
      </div>
    </section>
  );
};

const TodayView: React.FC = () => {
  const tasks = [
    { id: 1, title: 'Review quarterly budget', time: '09:00', done: true },
    { id: 2, title: 'Call with accountant', time: '14:30', done: false },
    { id: 3, title: 'Prepare dinner groceries', done: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-foreground">Wednesday, Jan 15</h3>
        <span className="text-sm text-muted-foreground">3 tasks</span>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <NotchedCard key={task.id} className="p-4 transition-all duration-200 hover:shadow-soft">
            <div className="flex items-center gap-4">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                task.done 
                  ? 'bg-primary border-primary' 
                  : 'border-border hover:border-primary/50'
              }`}>
                {task.done && <Check size={12} className="text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {task.title}
                </p>
              </div>
              {task.time && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock size={14} />
                  <span>{task.time}</span>
                </div>
              )}
            </div>
          </NotchedCard>
        ))}
      </div>

      {/* Habit row */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">Morning stretch</span>
          </div>
          <span className="text-xs text-muted-foreground">Due today</span>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
        <span>1 of 3 completed</span>
        <span>1 habit pending</span>
      </div>
    </div>
  );
};

const HabitsView: React.FC = () => {
  const habits = [
    { id: 1, title: 'Morning stretch', repeat: 'Daily', streak: 12 },
    { id: 2, title: 'Read 20 pages', repeat: 'Daily', streak: 5 },
    { id: 3, title: 'Weekly review', repeat: 'Weekly', streak: 8 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-foreground">Active Habits</h3>
        <span className="text-sm text-muted-foreground">3 habits</span>
      </div>

      <div className="space-y-3">
        {habits.map((habit) => (
          <NotchedCard key={habit.id} className="p-4 transition-all duration-200 hover:shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{habit.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{habit.repeat}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{habit.streak} days</p>
                <p className="text-xs text-muted-foreground">streak</p>
              </div>
            </div>
          </NotchedCard>
        ))}
      </div>

      <p className="text-sm text-muted-foreground text-center pt-4 border-t border-border italic">
        Habits are optional. No pressure to be perfect.
      </p>
    </div>
  );
};

const FinanceView: React.FC = () => {
  const accounts = [
    { id: 1, name: 'Checking', balance: 4250.00, icon: Wallet },
    { id: 2, name: 'Credit Card', balance: -820.50, icon: CreditCard },
  ];

  const transactions = [
    { id: 1, title: 'Grocery Store', amount: -67.50, type: 'expense' },
    { id: 2, title: 'Salary Deposit', amount: 3200.00, type: 'income' },
    { id: 3, title: 'Electric Bill', amount: -145.00, type: 'expense' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Accounts */}
      <div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-4">Accounts</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {accounts.map((account) => (
            <NotchedCard key={account.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <account.icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{account.name}</p>
                  <p className={`font-display font-bold text-lg ${
                    account.balance < 0 ? 'text-secondary' : 'text-foreground'
                  }`}>
                    ${Math.abs(account.balance).toFixed(2)}
                    {account.balance < 0 && <span className="text-xs ml-1">owed</span>}
                  </p>
                </div>
              </div>
            </NotchedCard>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Recent Transactions</h4>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div 
              key={tx.id} 
              className="flex items-center justify-between p-3 bg-surface rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === 'income' ? 'bg-primary/10' : 'bg-secondary/10'
                }`}>
                  {tx.type === 'income' 
                    ? <ArrowDownLeft size={14} className="text-primary" />
                    : <ArrowUpRight size={14} className="text-secondary" />
                  }
                </div>
                <span className="text-sm font-medium text-foreground">{tx.title}</span>
              </div>
              <span className={`text-sm font-semibold ${
                tx.type === 'income' ? 'text-primary' : 'text-foreground'
              }`}>
                {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Preview;

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, NotebookPen, Repeat, Wallet, Plus, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Today', icon: Home, href: '/today' },
  { label: 'Planner', icon: NotebookPen, href: '/planner' },
  { label: 'Capture', icon: Plus, href: '/capture', isFab: true },
  { label: 'Habits', icon: Repeat, href: '/habits' },
  { label: 'Finance', icon: Wallet, href: '/finance' },
];

export function BottomDock() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 md:hidden">
        <nav className="flex items-center justify-between px-2 py-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl ring-1 ring-white/10 dark:ring-black/10">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <div key={item.href} className="relative -top-6">
                  <Link
                    href={item.href}
                    className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                  >
                    <Icon className="w-6 h-6" />
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'fill-current')} />
                <span className="text-[10px] font-medium mt-1">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar (Placeholder for now) */}
      <div className="hidden md:flex flex-col w-64 border-r border-border h-screen sticky top-0 bg-muted/10">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Orbit</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.filter((i) => !i.isFab).map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

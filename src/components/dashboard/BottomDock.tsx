'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  NotebookPen,
  Wallet,
  Settings,
  Plus,
  Calendar,
  ChevronDown,
  ChevronRight,
  Repeat,
} from 'lucide-react';
import { CreateTaskSheet } from '@/components/dashboard/tasks/CreateTaskSheet';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const NAV_ITEMS = [
  { label: 'Today', icon: Home, href: '/today', exact: true },
  { label: 'Calendar', icon: Calendar, href: '/calendar', hasSubmenu: true },
  { label: 'Notes', icon: NotebookPen, href: '/notes' },
  { label: 'Capture', icon: Plus, href: '/capture', isFab: true },
  { label: 'Finance', icon: Wallet, href: '/finance' },
  { label: 'Habits', icon: Repeat, href: '/habits' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const CALENDAR_SUBITEMS = [
  { label: 'Daily', href: '/calendar/daily' },
  { label: 'Weekly', href: '/calendar/weekly' },
  { label: 'Monthly', href: '/calendar/monthly' },
];

export function BottomDock() {
  const pathname = usePathname();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(true); // Default open for visibility

  // Auto-expand if active subitem
  React.useEffect(() => {
    if (pathname.startsWith('/calendar')) {
      setIsCalendarOpen(true);
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Bottom Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 md:hidden">
        <div className="flex h-16 items-center justify-around rounded-full border border-white/20 bg-black/5 backdrop-blur-xl shadow-lg px-2">
          {NAV_ITEMS.map((item) => {
            // Skip Calendar on mobile dock for simplicity or map to main calendar link
            if (item.label === 'Calendar') return null;

            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <div key={item.href} className="relative -top-6">
                  <CreateTaskSheet>
                    <button className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </button>
                  </CreateTaskSheet>
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
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-border h-screen sticky top-0 bg-muted/10">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Orbit</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.filter((i) => !i.isFab).map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.hasSubmenu) {
              return (
                <Collapsible
                  key={item.label}
                  open={isCalendarOpen}
                  onOpenChange={setIsCalendarOpen}
                  className="space-y-1"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </div>
                      {isCalendarOpen ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-11">
                    {CALENDAR_SUBITEMS.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            'block py-2 text-sm transition-colors',
                            isSubActive
                              ? 'text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

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

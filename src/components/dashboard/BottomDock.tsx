'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  NotebookPen,
  Wallet,
  Calendar,
  ChevronDown,
  ChevronRight,
  Repeat,
  LayoutGrid,
  User,
  Flame,
} from 'lucide-react';
import { GlobalAddSheet } from '@/components/dashboard/GlobalAddSheet';
import { OrbitLogo } from '@/components/ui/orbit-logo';
import { useGamification } from '@/hooks/use-gamification';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const NAV_ITEMS = [
  { label: 'Today', icon: Home, href: '/today', exact: true },
  { label: 'Calendar', icon: Calendar, href: '/calendar', hasSubmenu: true },
  { label: 'Boards', icon: LayoutGrid, href: '/boards' },
  { label: 'Notes', icon: NotebookPen, href: '/notes' },
  { label: 'Finance', icon: Wallet, href: '/finance' },
  { label: 'Habits', icon: Repeat, href: '/habits' },
];

const CALENDAR_SUBITEMS = [
  { label: 'Daily', href: '/calendar/daily' },
  { label: 'Weekly', href: '/calendar/weekly' },
  { label: 'Monthly', href: '/calendar/monthly' },
];

export function BottomDock() {
  const pathname = usePathname();
  const { data: stats } = useGamification();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(true);

  React.useEffect(() => {
    if (pathname.startsWith('/calendar')) {
      setIsCalendarOpen(true);
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Bottom Dock - Premium Glassmorphism */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 md:hidden">
        {/* Decorative glow behind */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-amber-300/20 to-primary/20 rounded-full blur-xl -z-10" />

        <div className="relative flex h-[72px] items-center justify-around rounded-[28px] border border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl shadow-stone-400/20 px-6 overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />

          {/* Left side: Today, Boards, Notes */}
          {['Today', 'Boards', 'Notes'].map((label) => {
            const item = NAV_ITEMS.find((i) => i.label === label)!;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center p-2.5 rounded-2xl transition-colors duration-300',
                  isActive
                    ? 'text-primary scale-110'
                    : 'text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95',
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl shadow-inner" />
                )}
                <Icon
                  className={cn(
                    'relative w-5 h-5 transition-transform',
                    isActive && 'drop-shadow-sm',
                  )}
                />
                <span
                  className={cn(
                    'relative text-[10px] font-medium mt-1',
                    isActive && 'font-semibold',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Right side: Finance, Habits */}
          {['Finance', 'Habits'].map((label) => {
            const item = NAV_ITEMS.find((i) => i.label === label)!;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center p-2.5 rounded-2xl transition-colors duration-300',
                  isActive
                    ? 'text-primary scale-110'
                    : 'text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95',
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl shadow-inner" />
                )}
                <Icon
                  className={cn(
                    'relative w-5 h-5 transition-transform',
                    isActive && 'drop-shadow-sm',
                  )}
                />
                <span
                  className={cn(
                    'relative text-[10px] font-medium mt-1',
                    isActive && 'font-semibold',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar - Playful Design */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/20 h-screen sticky top-0 bg-gradient-to-br from-stone-50/95 via-amber-50/30 to-stone-100/90 backdrop-blur-sm overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-tr from-amber-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Brand */}
        <div className="relative p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <OrbitLogo size={32} />
              <div className="absolute -inset-1 bg-primary/10 rounded-full blur-sm -z-10" />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Orbit
            </h1>
          </div>
        </div>

        {/* User Profile Card - Premium Glassmorphism */}
        <Link
          href="/profile"
          className="relative mx-4 mb-5 p-3.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg shadow-stone-200/30 hover:shadow-xl hover:bg-white/80 hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          <div className="relative flex items-center gap-3">
            {/* Avatar with glow */}
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 border-2 border-white shadow-md flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                <User className="w-5 h-5 text-amber-700" />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-300/30 to-orange-300/30 rounded-xl blur-sm -z-10" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                Profile
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Level Badge - Premium pill */}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 shadow-sm">
                  <Flame className="w-3 h-3" />
                  Lv. {stats?.level || 1}
                </span>
                {/* Streak with fire */}
                <span className="text-[11px] text-muted-foreground font-medium">
                  🔥 {stats?.current_streak || 0}d
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Navigation - Playful pills */}
        <nav className="relative flex-1 px-3 space-y-1.5 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
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
                  className="space-y-0.5"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-md shadow-primary/10'
                          : 'text-muted-foreground hover:bg-white/70 hover:text-foreground hover:shadow-md hover:-translate-x-0.5',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm',
                            isActive
                              ? 'bg-gradient-to-br from-primary/30 to-primary/10 rotate-3'
                              : 'bg-white/80 group-hover:rotate-3',
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {item.label}
                      </div>
                      {isCalendarOpen ? (
                        <ChevronDown size={14} className="opacity-50" />
                      ) : (
                        <ChevronRight size={14} className="opacity-50" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 pl-11 pr-2 pt-1">
                    {CALENDAR_SUBITEMS.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            'block py-2 px-3 text-sm rounded-lg transition-all',
                            isSubActive
                              ? 'text-primary font-medium bg-primary/5'
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/50',
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-white/70 hover:text-foreground hover:shadow-md hover:-translate-x-0.5',
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm',
                    isActive
                      ? 'bg-gradient-to-br from-primary/30 to-primary/10 rotate-3'
                      : 'bg-white/80 group-hover:rotate-3',
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global FAB - Premium positioned */}
      <div className="fixed z-50 bottom-[90px] left-1/2 -translate-x-1/2 md:bottom-8 md:left-[280px] md:translate-x-0">
        <GlobalAddSheet />
      </div>
    </>
  );
}

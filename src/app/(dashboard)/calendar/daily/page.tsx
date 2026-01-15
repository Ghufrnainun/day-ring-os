'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, addDays, subDays, parseISO } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/dashboard/TaskList';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export default function DailyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  // Default to today if no param
  const date = dateParam ? parseISO(dateParam) : new Date();
  const dateString = format(date, 'yyyy-MM-dd');

  const goToDate = (newDate: Date) => {
    router.push(`/calendar/daily?date=${format(newDate, 'yyyy-MM-dd')}`);
  };

  const goToPrev = () => goToDate(subDays(date, 1));
  const goToNext = () => goToDate(addDays(date, 1));
  const goToToday = () => goToDate(new Date());

  return (
    <div className="flex flex-col space-y-6 pb-20 animate-fade-in">
      <header className="flex flex-col space-y-4">
        {/* Navigation Control */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Daily Planner
          </h1>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Jump to Today
          </Button>
        </div>

        <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm p-1 rounded-xl border border-border">
          <Button variant="ghost" size="icon" onClick={goToPrev}>
            <ChevronLeft size={18} />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="font-semibold tabular-nums text-base"
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                {format(date, 'EEEE, MMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && goToDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={goToNext}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      {/* Task List for Specific Date */}
      <TaskList date={dateString} />
    </div>
  );
}

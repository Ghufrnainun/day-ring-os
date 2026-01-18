'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { getLogicalDate, validateTimezone } from '@/lib/date-utils';

interface TimeContextType {
  timezone: string;
  logicalDate: Date;
  dateString: string; // YYYY-MM-DD
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export function TimeProvider({ children }: { children: React.ReactNode }) {
  const { data: profile } = useProfile();

  // Default to system timezone or UTC until profile loads
  const [timezone, setTimezone] = useState<string>('UTC');
  const [logicalDate, setLogicalDate] = useState<Date>(() =>
    getLogicalDate('UTC')
  );

  // Sync state with profile timezone
  useEffect(() => {
    if (profile?.timezone && validateTimezone(profile.timezone)) {
      setTimezone(profile.timezone);
    } else {
      // Fallback to browser timezone if feasible, otherwise UTC
      try {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTz || 'UTC');
      } catch {
        setTimezone('UTC');
      }
    }
  }, [profile?.timezone]);

  // Timer to update logical date every minute
  useEffect(() => {
    const updateTime = () => {
      setLogicalDate(getLogicalDate(timezone));
    };

    updateTime(); // Initial update on timezone change

    // Check every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [timezone]);

  // Derived YYYY-MM-DD string
  const dateString = logicalDate.toISOString().split('T')[0];

  return (
    <TimeContext.Provider value={{ timezone, logicalDate, dateString }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}

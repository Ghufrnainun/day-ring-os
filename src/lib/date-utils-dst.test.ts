import { describe, it, expect } from 'vitest';
import { getLogicalDate, formatLogicalDate } from './date-utils';

/**
 * DST Edge Case Tests
 *
 * These tests verify that logical_day transitions correctly during:
 * - Spring Forward (DST starts - clocks skip 1 hour)
 * - Fall Back (DST ends - clocks repeat 1 hour)
 */
describe('DST Edge Cases', () => {
  // --- US DST 2024 Timeline ---
  // Spring Forward: March 10, 2024, 2:00 AM → 3:00 AM (UTC-5 → UTC-4)
  // Fall Back: November 3, 2024, 2:00 AM → 1:00 AM (UTC-4 → UTC-5)

  describe('Spring Forward (March 10, 2024)', () => {
    it('correctly handles time just before spring forward', () => {
      // 1:59 AM EST on March 10, 2024 (still in standard time)
      const beforeSpring = new Date('2024-03-10T06:59:00Z'); // 06:59 UTC = 01:59 EST
      const result = getLogicalDate('America/New_York', beforeSpring);

      // Should still be March 10
      expect(result.getDate()).toBe(10);
      expect(result.getMonth()).toBe(2); // March is 0-indexed = 2
    });

    it('correctly handles time just after spring forward', () => {
      // 3:01 AM EDT on March 10, 2024 (after DST starts)
      const afterSpring = new Date('2024-03-10T07:01:00Z'); // 07:01 UTC = 03:01 EDT
      const result = getLogicalDate('America/New_York', afterSpring);

      // Should still be March 10
      expect(result.getDate()).toBe(10);
    });

    it('formats date correctly during DST transition', () => {
      const beforeDST = new Date('2024-03-10T06:59:00Z');
      const afterDST = new Date('2024-03-10T07:01:00Z');

      const before = formatLogicalDate(
        getLogicalDate('America/New_York', beforeDST),
      );
      const after = formatLogicalDate(
        getLogicalDate('America/New_York', afterDST),
      );

      // Both should be the same date
      expect(before).toBe('2024-03-10');
      expect(after).toBe('2024-03-10');
    });
  });

  describe('Fall Back (November 3, 2024)', () => {
    it('correctly handles time just before fall back', () => {
      // 1:59 AM EDT on November 3, 2024 (before DST ends)
      const beforeFall = new Date('2024-11-03T05:59:00Z'); // 05:59 UTC = 01:59 EDT
      const result = getLogicalDate('America/New_York', beforeFall);

      expect(result.getDate()).toBe(3);
      expect(result.getMonth()).toBe(10); // November = 10
    });

    it('correctly handles time during fall back ambiguity', () => {
      // 1:30 AM EST (after fall back) - could be interpreted as either EDT or EST
      // 06:30 UTC = 01:30 EST (standard time)
      const duringFall = new Date('2024-11-03T06:30:00Z');
      const result = getLogicalDate('America/New_York', duringFall);

      expect(result.getDate()).toBe(3);
      expect(result.getMonth()).toBe(10);
    });

    it('correctly handles time just after fall back', () => {
      // 2:01 AM EST on November 3, 2024 (after DST ends)
      const afterFall = new Date('2024-11-03T07:01:00Z'); // 07:01 UTC = 02:01 EST
      const result = getLogicalDate('America/New_York', afterFall);

      expect(result.getDate()).toBe(3);
    });
  });

  describe('Cross-Day DST Transitions', () => {
    it('handles late night before DST correctly', () => {
      // 11:30 PM on March 9, 2024 (night before spring forward)
      const lateNight = new Date('2024-03-10T04:30:00Z'); // 04:30 UTC = 23:30 EST
      const result = getLogicalDate('America/New_York', lateNight);

      expect(result.getDate()).toBe(9);
      expect(formatLogicalDate(result)).toBe('2024-03-09');
    });

    it('handles early morning after DST correctly', () => {
      // 12:01 AM on March 10, 2024 (just after midnight, before DST)
      const earlyMorning = new Date('2024-03-10T05:01:00Z'); // 05:01 UTC = 00:01 EST
      const result = getLogicalDate('America/New_York', earlyMorning);

      expect(result.getDate()).toBe(10);
      expect(formatLogicalDate(result)).toBe('2024-03-10');
    });
  });
});

/**
 * Timezone Boundary Tests
 *
 * Verify logical_day rolls over correctly at midnight in various timezones
 */
describe('Timezone Midnight Boundaries', () => {
  describe('UTC+14 (Line Islands)', () => {
    it('is already next day when UTC is noon', () => {
      const utcNoon = new Date('2024-01-15T12:00:00Z');
      const result = getLogicalDate('Pacific/Kiritimati', utcNoon);

      // UTC + 14 = 02:00 next day
      expect(result.getDate()).toBe(16);
    });
  });

  describe('UTC-12 (Baker Island)', () => {
    it('is still previous day when UTC is noon', () => {
      const utcNoon = new Date('2024-01-15T12:00:00Z');
      const result = getLogicalDate('Etc/GMT+12', utcNoon);

      // UTC - 12 = 00:00 same day
      expect(result.getDate()).toBe(15);
    });
  });

  describe('Half-hour offset timezones', () => {
    it('handles India (UTC+5:30) correctly', () => {
      const eveningUTC = new Date('2024-01-15T19:00:00Z');
      const result = getLogicalDate('Asia/Kolkata', eveningUTC);

      // 19:00 UTC + 5:30 = 00:30 next day
      expect(result.getDate()).toBe(16);
    });

    it('handles Nepal (UTC+5:45) correctly', () => {
      const eveningUTC = new Date('2024-01-15T18:20:00Z');
      const result = getLogicalDate('Asia/Kathmandu', eveningUTC);

      // 18:20 UTC + 5:45 = 00:05 next day
      expect(result.getDate()).toBe(16);
    });
  });

  describe('Jakarta (UTC+7)', () => {
    it('handles late-night user correctly', () => {
      // User in Jakarta at 23:30 local time
      const jakartaLateNight = new Date('2024-01-15T16:30:00Z'); // 16:30 UTC = 23:30 WIB
      const result = getLogicalDate('Asia/Jakarta', jakartaLateNight);

      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(23);
    });

    it('handles early morning correctly', () => {
      // User in Jakarta at 00:30 local time
      const jakartaEarlyMorning = new Date('2024-01-15T17:30:00Z'); // 17:30 UTC = 00:30 WIB
      const result = getLogicalDate('Asia/Jakarta', jakartaEarlyMorning);

      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(0);
    });
  });
});

import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { startOfDay } from 'date-fns';

/**
 * Returns the current date object as if the system time were in the target timezone.
 *
 * NOTE: The returned Date object's UTC timestamp will be shifted so that its
 * "local" getters (getHours, etc) reflect the time in the target timezone.
 * unique to the "Logical Day" pattern.
 *
 * @param timezone IANA timezone string (e.g., 'Asia/Tokyo') or 'UTC'
 */
export function getLogicalDate(
  timezone: string = 'UTC',
  referenceDate: Date = new Date()
): Date {
  try {
    return toZonedTime(referenceDate, timezone);
  } catch (error) {
    console.error(`Invalid timezone: ${timezone}, falling back to UTC`);
    return new Date();
  }
}

/**
 * Returns the start of the day (00:00:00) for the given date,
 * preserving the "shifted" status of the logical date.
 */
export function startOfLogicalDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Formats a logical date to YYYY-MM-DD string.
 * Uses the date object's internal state directly.
 */
export function formatLogicalDate(date: Date): string {
  // Since 'date' is already shifted by toZonedTime, we can just format it
  // But to be safe and avoid double-shift issues, we use standard format
  // assuming 'date' is already the "Wall Time" at the location.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates if the provided string is a valid IANA timezone.
 */
export function validateTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (ex) {
    return false;
  }
}

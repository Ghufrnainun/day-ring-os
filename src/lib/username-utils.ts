/**
 * Generate username from email (for onboarding)
 * Utility function (not a server action)
 */
export function generateUsername(email: string): string {
  const emailPrefix = email.split('@')[0].toLowerCase();
  const cleanPrefix = emailPrefix.replace(/[^a-z0-9]/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${cleanPrefix}-${randomSuffix}`.substring(0, 20);
}

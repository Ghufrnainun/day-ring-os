import { generateDueRecurringTransactions } from '@/actions/recurring-transactions';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron endpoint to generate recurring transactions
 * Runs daily at 2 AM via Vercel Cron
 *
 * Auth: Requires CRON_SECRET header
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await generateDueRecurringTransactions();

    return NextResponse.json({
      success: result.success,
      generated: result.generated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Recurring transactions cron error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recurring transactions' },
      { status: 500 },
    );
  }
}

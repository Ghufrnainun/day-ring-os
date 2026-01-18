import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAnalyticsInsights } from '@/lib/analytics';
import {
  createRequestContext,
  logRequest,
  logResponse,
} from '@/lib/api/logger';

/**
 * Analytics API Endpoint
 *
 * Provides advanced analytics including:
 * - Correlations between productivity and spending
 * - Pattern detection (best days, streaks)
 * - Personalized recommendations
 *
 * Query Parameters:
 * - start_date: YYYY-MM-DD (default: 30 days ago)
 * - end_date: YYYY-MM-DD (default: today)
 */
export async function GET(request: NextRequest) {
  const ctx = createRequestContext(request);
  logRequest(ctx);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logResponse(ctx, 401);
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Please log in' },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;

  // Default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startDate =
    searchParams.get('start_date') || thirtyDaysAgo.toISOString().split('T')[0];
  const endDate =
    searchParams.get('end_date') || today.toISOString().split('T')[0];

  try {
    const insights = await generateAnalyticsInsights(
      supabase,
      user.id,
      startDate,
      endDate,
    );

    logResponse(ctx, 200);

    return NextResponse.json({
      success: true,
      data: insights,
      meta: {
        request_id: ctx.requestId,
        generated_at: new Date().toISOString(),
        note:
          insights.correlations.length === 0
            ? 'Need at least 7 days of data for correlation analysis'
            : undefined,
      },
    });
  } catch (error: any) {
    console.error('[ANALYTICS] Error:', error);
    logResponse(ctx, 500);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}

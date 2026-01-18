import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exportTasksCSV,
  exportTransactionsCSV,
  exportHabitsSummaryCSV,
  generateSummaryReport,
} from '@/lib/exports';
import {
  logAudit,
  createRequestContext,
  logRequest,
  logResponse,
} from '@/lib/api/logger';

/**
 * Export API Endpoint
 *
 * Exports user data in CSV format.
 *
 * Query Parameters:
 * - type: 'tasks' | 'transactions' | 'habits' | 'summary'
 * - start_date: YYYY-MM-DD
 * - end_date: YYYY-MM-DD
 * - format: 'csv' | 'json' (default: csv)
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
      { error: 'Unauthorized', message: 'Please log in to export data' },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const format = searchParams.get('format') || 'csv';

  // Validate required params
  if (!type || !startDate || !endDate) {
    logResponse(ctx, 400);
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Required: type, start_date, end_date',
      },
      { status: 400 },
    );
  }

  // Validate date range (max 1 year)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays > 365) {
    logResponse(ctx, 400);
    return NextResponse.json(
      { error: 'Validation Error', message: 'Date range cannot exceed 1 year' },
      { status: 400 },
    );
  }

  try {
    let content: string;
    let filename: string;
    let contentType: string;

    switch (type) {
      case 'tasks':
        content = await exportTasksCSV(supabase, user.id, startDate, endDate);
        filename = `orbit-tasks-${startDate}-to-${endDate}.csv`;
        contentType = 'text/csv';
        break;

      case 'transactions':
        content = await exportTransactionsCSV(
          supabase,
          user.id,
          startDate,
          endDate,
        );
        filename = `orbit-transactions-${startDate}-to-${endDate}.csv`;
        contentType = 'text/csv';
        break;

      case 'habits':
        content = await exportHabitsSummaryCSV(
          supabase,
          user.id,
          startDate,
          endDate,
        );
        filename = `orbit-habits-${startDate}-to-${endDate}.csv`;
        contentType = 'text/csv';
        break;

      case 'summary': {
        const report = await generateSummaryReport(
          supabase,
          user.id,
          startDate,
          endDate,
        );
        if (format === 'json') {
          logResponse(ctx, 200);

          // Audit log for export
          await logAudit(supabase, {
            userId: user.id,
            action: 'export',
            tableName: 'summary',
            requestId: ctx.requestId,
          });

          return NextResponse.json({
            success: true,
            data: report,
            meta: {
              request_id: ctx.requestId,
              exported_at: new Date().toISOString(),
            },
          });
        }
        // For CSV, convert summary to simple format
        content = `Orbit Summary Report
Period: ${startDate} to ${endDate}
Generated: ${new Date().toISOString()}

=== TASKS ===
Total: ${report.tasks.total}
Completed: ${report.tasks.completed}
Skipped: ${report.tasks.skipped}
Pending: ${report.tasks.pending}
Completion Rate: ${report.tasks.completionRate}%

=== HABITS ===
Current Streak: ${report.habits.currentStreak} days
Longest Streak: ${report.habits.longestStreak} days
Average Completion: ${report.habits.avgCompletionRate}%

=== FINANCE ===
Total Income: ${report.finance.totalIncome}
Total Expense: ${report.finance.totalExpense}
Net Flow: ${report.finance.netFlow}

Top Expense Categories:
${report.finance.topCategories.map((c) => `  - ${c.category}: ${c.amount}`).join('\n')}
`;
        filename = `orbit-summary-${startDate}-to-${endDate}.txt`;
        contentType = 'text/plain';
        break;
      }

      default:
        logResponse(ctx, 400);
        return NextResponse.json(
          {
            error: 'Validation Error',
            message:
              'Invalid type. Use: tasks, transactions, habits, or summary',
          },
          { status: 400 },
        );
    }

    // Audit log for export
    await logAudit(supabase, {
      userId: user.id,
      action: 'export',
      tableName: type,
      requestId: ctx.requestId,
    });

    logResponse(ctx, 200);

    // Return file download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Request-ID': ctx.requestId,
      },
    });
  } catch (error: any) {
    console.error('[EXPORT] Error:', error);
    logResponse(ctx, 500);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}

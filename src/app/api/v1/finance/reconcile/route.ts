import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createRequestContext,
  logRequest,
  logResponse,
  logAudit,
} from '@/lib/api/logger';

/**
 * Finance Reconciliation API Endpoint
 *
 * Reconciles account balances by comparing calculated balance
 * (from transactions) with stored balance.
 *
 * POST body:
 * - account_id: string (required)
 * - action: 'check' | 'fix' (default: check)
 *
 * Returns discrepancies or applies fixes.
 */
export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { account_id, action = 'check' } = body;

    if (!account_id) {
      logResponse(ctx, 400);
      return NextResponse.json(
        { error: 'Validation Error', message: 'account_id is required' },
        { status: 400 },
      );
    }

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('money_accounts')
      .select('id, name, balance, currency')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      logResponse(ctx, 404);
      return NextResponse.json(
        { error: 'Not Found', message: 'Account not found' },
        { status: 404 },
      );
    }

    // Calculate balance from transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('account_id', account_id)
      .eq('user_id', user.id);

    let calculatedBalance = 0;
    transactions?.forEach((t) => {
      if (t.type === 'income') {
        calculatedBalance += Number(t.amount);
      } else if (t.type === 'expense') {
        calculatedBalance -= Number(t.amount);
      } else if (t.type === 'transfer') {
        // For source account
        calculatedBalance -= Number(t.amount);
      }
    });

    // Check for transfers TO this account
    const { data: transfersIn } = await supabase
      .from('transactions')
      .select('amount')
      .eq('to_account_id', account_id)
      .eq('user_id', user.id)
      .eq('type', 'transfer');

    transfersIn?.forEach((t) => {
      calculatedBalance += Number(t.amount);
    });

    const storedBalance = Number(account.balance);
    const discrepancy = storedBalance - calculatedBalance;
    const hasDiscrepancy = Math.abs(discrepancy) > 0.01; // Allow for floating point

    const result = {
      account: {
        id: account.id,
        name: account.name,
        currency: account.currency,
      },
      stored_balance: storedBalance,
      calculated_balance: calculatedBalance,
      discrepancy: Math.round(discrepancy * 100) / 100,
      has_discrepancy: hasDiscrepancy,
      action_taken: 'none',
    };

    // If fix action and there's a discrepancy
    if (action === 'fix' && hasDiscrepancy) {
      // Create adjustment transaction
      const adjustmentType = discrepancy > 0 ? 'expense' : 'income';
      const adjustmentAmount = Math.abs(discrepancy);

      const { error: adjustError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: account_id,
          amount: adjustmentAmount,
          type: adjustmentType,
          description: `Reconciliation adjustment (${ctx.requestId})`,
          category: 'Adjustment',
          logical_day: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        });

      if (adjustError) {
        logResponse(ctx, 500);
        return NextResponse.json(
          { error: 'Database Error', message: adjustError.message },
          { status: 500 },
        );
      }

      // Update account balance
      const { error: updateError } = await supabase
        .from('money_accounts')
        .update({
          balance: calculatedBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account_id)
        .eq('user_id', user.id);

      if (updateError) {
        logResponse(ctx, 500);
        return NextResponse.json(
          { error: 'Database Error', message: updateError.message },
          { status: 500 },
        );
      }

      result.action_taken = 'fixed';
      result.stored_balance = calculatedBalance;
      result.has_discrepancy = false;

      // Audit log
      await logAudit(supabase, {
        userId: user.id,
        action: 'reconcile_fix',
        tableName: 'money_accounts',
        recordId: account_id,
        changes: {
          old_balance: { old: storedBalance, new: calculatedBalance },
        },
        requestId: ctx.requestId,
      });
    }

    // Audit log for check
    await logAudit(supabase, {
      userId: user.id,
      action: action === 'fix' ? 'reconcile_fix' : 'reconcile_check',
      tableName: 'money_accounts',
      recordId: account_id,
      requestId: ctx.requestId,
    });

    logResponse(ctx, 200);

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        request_id: ctx.requestId,
        reconciled_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[RECONCILE] Error:', error);
    logResponse(ctx, 500);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET - Check all accounts for discrepancies
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

  try {
    // Get all accounts
    const { data: accounts } = await supabase
      .from('money_accounts')
      .select('id, name, balance, currency')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (!accounts || accounts.length === 0) {
      logResponse(ctx, 200);
      return NextResponse.json({
        success: true,
        data: {
          accounts: [],
          has_any_discrepancy: false,
        },
        meta: { request_id: ctx.requestId },
      });
    }

    const results = await Promise.all(
      accounts.map(async (account) => {
        // Calculate balance from transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('account_id', account.id)
          .eq('user_id', user.id);

        let calculated = 0;
        transactions?.forEach((t) => {
          if (t.type === 'income') calculated += Number(t.amount);
          else if (t.type === 'expense') calculated -= Number(t.amount);
          else if (t.type === 'transfer') calculated -= Number(t.amount);
        });

        // Transfers in
        const { data: transfersIn } = await supabase
          .from('transactions')
          .select('amount')
          .eq('to_account_id', account.id)
          .eq('user_id', user.id)
          .eq('type', 'transfer');

        transfersIn?.forEach((t) => {
          calculated += Number(t.amount);
        });

        const stored = Number(account.balance);
        const discrepancy = Math.round((stored - calculated) * 100) / 100;

        return {
          id: account.id,
          name: account.name,
          currency: account.currency,
          stored_balance: stored,
          calculated_balance: calculated,
          discrepancy,
          has_discrepancy: Math.abs(discrepancy) > 0.01,
        };
      }),
    );

    logResponse(ctx, 200);

    return NextResponse.json({
      success: true,
      data: {
        accounts: results,
        has_any_discrepancy: results.some((r) => r.has_discrepancy),
        total_discrepancy: results.reduce((sum, r) => sum + r.discrepancy, 0),
      },
      meta: {
        request_id: ctx.requestId,
        checked_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[RECONCILE] Error:', error);
    logResponse(ctx, 500);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}

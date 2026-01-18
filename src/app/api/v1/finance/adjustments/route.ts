import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createRequestContext,
  logRequest,
  logResponse,
  logAudit,
} from '@/lib/api/logger';

/**
 * Transaction Adjustment API Endpoint
 *
 * Creates adjustment transactions instead of editing/deleting original transactions.
 * This ensures a complete audit trail for all financial changes.
 *
 * POST body:
 * - original_transaction_id: string (required)
 * - adjustment_reason: string (required)
 * - new_amount?: number (if correcting amount)
 * - new_category?: string (category correction)
 * - void?: boolean (to void a transaction entirely)
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
    const {
      original_transaction_id,
      adjustment_reason,
      new_amount,
      new_category,
      void: voidTransaction = false,
    } = body;

    // Validation
    if (!original_transaction_id) {
      logResponse(ctx, 400);
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'original_transaction_id is required',
        },
        { status: 400 },
      );
    }

    if (!adjustment_reason || adjustment_reason.trim().length < 5) {
      logResponse(ctx, 400);
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'adjustment_reason is required (min 5 chars)',
        },
        { status: 400 },
      );
    }

    // Get original transaction
    const { data: original, error: getError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', original_transaction_id)
      .eq('user_id', user.id)
      .single();

    if (getError || !original) {
      logResponse(ctx, 404);
      return NextResponse.json(
        { error: 'Not Found', message: 'Transaction not found' },
        { status: 404 },
      );
    }

    // Check if already voided
    if (original.is_voided) {
      logResponse(ctx, 400);
      return NextResponse.json(
        { error: 'Validation Error', message: 'Transaction already voided' },
        { status: 400 },
      );
    }

    const adjustments: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Void the original transaction
    if (voidTransaction) {
      // Create a reversing transaction
      const reverseType = original.type === 'income' ? 'expense' : 'income';

      const { data: reversal, error: reversalError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: original.account_id,
          amount: original.amount,
          type: reverseType,
          description: `VOID: ${original.description || 'No description'} - Reason: ${adjustment_reason}`,
          category: 'Adjustment',
          logical_day: today,
          original_transaction_id: original.id,
          is_adjustment: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (reversalError) {
        logResponse(ctx, 500);
        return NextResponse.json(
          { error: 'Database Error', message: reversalError.message },
          { status: 500 },
        );
      }

      // Mark original as voided
      await supabase
        .from('transactions')
        .update({
          is_voided: true,
          void_reason: adjustment_reason,
          voided_at: new Date().toISOString(),
          voided_by_transaction_id: reversal.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', original.id)
        .eq('user_id', user.id);

      // Update account balance
      const balanceChange =
        original.type === 'income'
          ? -Number(original.amount)
          : Number(original.amount);

      await supabase
        .from('money_accounts')
        .update({
          balance: supabase.rpc('increment_balance', {
            account_id: original.account_id,
            delta: balanceChange,
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', original.account_id)
        .eq('user_id', user.id);

      adjustments.push({
        type: 'void',
        reversal_transaction_id: reversal.id,
      });
    }

    // Amount correction
    if (new_amount !== undefined && new_amount !== Number(original.amount)) {
      const difference = new_amount - Number(original.amount);

      // Create correction transaction for the difference
      const correctionType =
        difference > 0
          ? original.type === 'income'
            ? 'income'
            : 'expense'
          : original.type === 'income'
            ? 'expense'
            : 'income';

      const { data: correction, error: corrError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: original.account_id,
          amount: Math.abs(difference),
          type: correctionType,
          description: `Amount correction for ${original.description || 'transaction'} - Reason: ${adjustment_reason}`,
          category: 'Adjustment',
          logical_day: today,
          original_transaction_id: original.id,
          is_adjustment: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (corrError) {
        logResponse(ctx, 500);
        return NextResponse.json(
          { error: 'Database Error', message: corrError.message },
          { status: 500 },
        );
      }

      adjustments.push({
        type: 'amount_correction',
        correction_transaction_id: correction.id,
        original_amount: original.amount,
        new_amount,
        difference,
      });
    }

    // Category correction (metadata only, no financial impact)
    if (new_category && new_category !== original.category) {
      // For category changes, we add a note to the original transaction
      // This doesn't require a new transaction as it doesn't affect balance
      await supabase
        .from('transactions')
        .update({
          category: new_category,
          adjustment_note: `Category changed from "${original.category || 'None'}" to "${new_category}". Reason: ${adjustment_reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', original.id)
        .eq('user_id', user.id);

      adjustments.push({
        type: 'category_change',
        original_category: original.category,
        new_category,
      });
    }

    // Audit log
    await logAudit(supabase, {
      userId: user.id,
      action: voidTransaction ? 'transaction_void' : 'transaction_adjust',
      tableName: 'transactions',
      recordId: original_transaction_id,
      changes: {
        adjustments: { old: null, new: adjustments },
        reason: { old: null, new: adjustment_reason },
      },
      requestId: ctx.requestId,
    });

    logResponse(ctx, 200);

    return NextResponse.json({
      success: true,
      data: {
        original_transaction_id,
        adjustments,
        adjustment_reason,
        processed_at: new Date().toISOString(),
      },
      meta: {
        request_id: ctx.requestId,
        message:
          'Transaction adjusted successfully. Original record preserved with full audit trail.',
      },
    });
  } catch (error: any) {
    console.error('[ADJUSTMENT] Error:', error);
    logResponse(ctx, 500);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}

/**
 * GET - Get adjustment history for a transaction
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

  const transactionId = request.nextUrl.searchParams.get('transaction_id');

  if (!transactionId) {
    logResponse(ctx, 400);
    return NextResponse.json(
      { error: 'Validation Error', message: 'transaction_id is required' },
      { status: 400 },
    );
  }

  try {
    // Get original transaction
    const { data: original } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (!original) {
      logResponse(ctx, 404);
      return NextResponse.json(
        { error: 'Not Found', message: 'Transaction not found' },
        { status: 404 },
      );
    }

    // Get all adjustments linked to this transaction
    const { data: adjustments } = await supabase
      .from('transactions')
      .select('*')
      .eq('original_transaction_id', transactionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // Get audit logs for this transaction
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('record_id', transactionId)
      .eq('table_name', 'transactions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    logResponse(ctx, 200);

    return NextResponse.json({
      success: true,
      data: {
        original,
        adjustments: adjustments || [],
        audit_trail: auditLogs || [],
        is_voided: original.is_voided || false,
      },
      meta: {
        request_id: ctx.requestId,
      },
    });
  } catch (error: any) {
    console.error('[ADJUSTMENT] Error:', error);
    logResponse(ctx, 500);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}

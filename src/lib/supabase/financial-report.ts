import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'
import type { ReportRange } from '@/lib/validations/reports'

type TransactionKind = Database['public']['Enums']['transaction_kind']

/**
 * Shape of the jsonb built by public.financial_report(). Dates are
 * "YYYY-MM-DD" strings and amounts are plain numbers.
 */
export interface FinancialReport {
  from: string
  to: string
  opening_balance: number
  total_income: number
  total_expense: number
  closing_balance: number
  categories: { kind: TransactionKind; name: string; total: number; movements: number }[]
  fee_status: {
    /** Fee months of the range that were due; 0 when no period covers it. */
    months: number
    houses: number
    up_to_date: number
    pending: { house: string; months: string[] }[]
  }
}

/** Runs with the caller's session, so RLS applies as it does in the app. */
export async function getFinancialReport({ from, to }: ReportRange): Promise<FinancialReport> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('financial_report', { p_from: from, p_to: to })
  if (error) throw error

  return data as unknown as FinancialReport
}

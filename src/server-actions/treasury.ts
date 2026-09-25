'use server'

import type { PostgrestError } from '@supabase/supabase-js'
import { type ActionResult, postgrestErrorMessage, UNIQUE_VIOLATION } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import {
  type CreateTransactionInput,
  createTransactionSchema,
  type RecordFeePaymentInput,
  recordFeePaymentSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from '@/lib/validations/treasury'

function toMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, {
    fallback,
    unique: {
      transactions_one_per_house_month_category:
        'Esa casa ya tiene registrada la cuota de uno de los meses seleccionados',
    },
  })
}

export interface FeePaymentSummary {
  fee_count: number
  late_fee_count: number
  total: number
}

export async function recordFeePayment(
  input: RecordFeePaymentInput,
): Promise<ActionResult<FeePaymentSummary>> {
  const parsed = recordFeePaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { property_id, fee_months, occurred_on, payment_method, folio, reference, notes, waive_late_fee } =
    parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('record_fee_payment', {
      p_property_id: property_id,
      p_fee_months: fee_months,
      p_occurred_on: occurred_on,
      p_folio: folio,
      p_payment_method: payment_method,
      p_reference: reference || undefined,
      p_notes: notes || undefined,
      // null = let the due-day rule decide per month; false = waive every recargo
      p_apply_late_fee: waive_late_fee ? false : undefined,
    })
    .single()

  if (error) {
    // Raised by the RPC: no period for that date, or the house is gone.
    if (error.code === 'P0002') {
      return {
        error: error.message.includes('no period')
          ? 'Ningún periodo cubre esa fecha. Crea el periodo primero.'
          : 'La casa seleccionada ya no existe',
      }
    }
    return { error: toMessage(error, 'No se pudo registrar la cuota, intenta nuevamente') }
  }

  return {
    data: { fee_count: data.fee_count, late_fee_count: data.late_fee_count, total: Number(data.total) },
  }
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createTransactionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const {
    kind,
    category_id,
    amount,
    occurred_on,
    payment_method,
    folio,
    reference,
    property_id,
    description,
    notes,
  } = parsed.data
  const supabase = await createClient()

  // Fees need a fee_month and the period's rates; only record_fee_payment knows how.
  const { data: category } = await supabase
    .from('transaction_categories')
    .select('key')
    .eq('id', category_id)
    .maybeSingle()
  if (category?.key) {
    return { error: 'Las cuotas y recargos se registran con "Registrar cuota"' }
  }

  const { data: period } = await supabase
    .from('periods')
    .select('id')
    .lte('starts_on', occurred_on)
    .gte('ends_on', occurred_on)
    .maybeSingle()
  if (!period) {
    return { error: 'Ningún periodo cubre esa fecha. Crea el periodo primero.' }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      kind,
      category_id,
      period_id: period.id,
      amount,
      occurred_on,
      payment_method,
      folio: folio || null,
      reference: reference || null,
      property_id: kind === 'income' ? property_id : null,
      description,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (error) {
    // Composite FK: the category belongs to the other kind.
    if (error.code === '23503') {
      return { error: 'La categoría no corresponde al tipo de movimiento' }
    }
    return { error: toMessage(error, 'No se pudo registrar el movimiento, intenta nuevamente') }
  }

  return { data }
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateTransactionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const {
    category_id,
    amount,
    occurred_on,
    payment_method,
    folio,
    reference,
    property_id,
    description,
    notes,
  } = parsed.data
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('transactions')
    .select('kind, category:transaction_categories!inner ( key )')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!current) {
    return { error: 'El movimiento ya no existe' }
  }

  // Fee and late-fee rows are produced by record_fee_payment from the period's
  // rates and due day. Editing their amount, date, month or house here would
  // silently break that; only the receipt details can change. Anything else is
  // fixed by deleting the receipt and recording it again.
  if (current.category.key) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ payment_method, folio: folio || null, reference: reference || null, notes: notes || null })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo actualizar el movimiento, intenta nuevamente') }
    }
    return { data }
  }

  const { data: category } = await supabase
    .from('transaction_categories')
    .select('key')
    .eq('id', category_id)
    .maybeSingle()
  if (category?.key) {
    return { error: 'Las cuotas y recargos se registran con "Registrar cuota"' }
  }

  // The date may have moved into another period.
  const { data: period } = await supabase
    .from('periods')
    .select('id')
    .lte('starts_on', occurred_on)
    .gte('ends_on', occurred_on)
    .maybeSingle()
  if (!period) {
    return { error: 'Ningún periodo cubre esa fecha. Crea el periodo primero.' }
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      category_id,
      period_id: period.id,
      amount,
      occurred_on,
      payment_method,
      folio: folio || null,
      reference: reference || null,
      property_id: current.kind === 'income' ? property_id : null,
      description,
      notes: notes || null,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23503') {
      return { error: 'La categoría no corresponde al tipo de movimiento' }
    }
    return { error: toMessage(error, 'No se pudo actualizar el movimiento, intenta nuevamente') }
  }

  return { data }
}

/**
 * Soft-deletes movements (sets deleted_at; a DB trigger stamps deleted_by).
 * Returns how many rows were affected: RLS doesn't raise on UPDATE, it just
 * filters rows out, so a short count means no permission.
 */
export async function deleteTransactions(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) {
    return { error: 'Selecciona al menos un movimiento' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', uniqueIds)
    .is('deleted_at', null)
    .select('id')

  if (error) {
    return { error: toMessage(error, 'No se pudieron eliminar los movimientos, intenta nuevamente') }
  }

  if (data.length === 0) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  return { data: { deleted: data.length } }
}

/** Undoes a soft delete. Fails with 23505 if the same fee month was re-recorded meanwhile. */
export async function restoreTransactions(ids: string[]): Promise<ActionResult<{ restored: number }>> {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) {
    return { error: 'Nada que restaurar' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .update({ deleted_at: null })
    .in('id', uniqueIds)
    .not('deleted_at', 'is', null)
    .select('id')

  if (error) {
    const message = toMessage(error, 'No se pudieron restaurar los movimientos, intenta nuevamente')
    return {
      error: error.code === UNIQUE_VIOLATION ? `No se pudo restaurar: ${message.toLowerCase()}` : message,
    }
  }

  if (data.length === 0) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  return { data: { restored: data.length } }
}

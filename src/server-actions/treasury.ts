import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import {
  type ActionResult,
  EXCLUSION_VIOLATION,
  FOLIO_TAKEN_MESSAGE,
  isFolioTaken,
  postgrestErrorMessage,
  UNIQUE_VIOLATION,
} from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import { systemCategorySource } from '@/lib/system-categories'
import { formatMonth } from '@/lib/utils'
import {
  type CategoryInput,
  categorySchema,
  type CreateTransactionInput,
  createTransactionSchema,
  type PeriodInput,
  periodSchema,
  type RecordFeePaymentInput,
  recordFeePaymentSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from '@/lib/validations/treasury'

// Postgres error codes not covered by postgrestErrorMessage.
const FK_VIOLATION = '23503'
const CHECK_VIOLATION = '23514'

function toMessage(error: PostgrestError, fallback: string) {
  if (isFolioTaken(error)) return FOLIO_TAKEN_MESSAGE
  return postgrestErrorMessage(error, {
    fallback,
    unique: {
      transactions_one_per_house_month_category:
        'Esa casa ya tiene registrada la cuota de uno de los meses seleccionados',
      transactions_one_per_hall_reservation_category:
        'Esa reservación de terraza ya tiene su pago registrado',
      transaction_categories_name_unique: 'Ya existe una categoría con ese nombre',
      periods_name_unique: 'Ya existe un periodo con ese nombre',
    },
  })
}

function systemCategoryMessage(key: string) {
  return `Los movimientos de esa categoría se registran desde ${systemCategorySource(key)}`
}

export interface FeePaymentSummary {
  fee_count: number
  late_fee_count: number
  total: number
}

const recordFeePaymentFn = createServerFn({ method: 'POST' })
  .validator((input: RecordFeePaymentInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<FeePaymentSummary>> => {
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
      // Postgres only reports the first clash, so look up every selected month already paid.
      if (error.code === UNIQUE_VIOLATION) {
        const { data: paid } = await supabase
          .from('transactions')
          .select('fee_month')
          .eq('property_id', property_id)
          .in('fee_month', fee_months)
          .is('deleted_at', null)
          .order('fee_month')
        const months = [...new Set(paid?.map((row) => formatMonth(row.fee_month)))]
        if (months.length > 0) {
          return { error: `Esa casa ya tiene registrada la cuota de ${months.join(', ')}` }
        }
      }
      return { error: toMessage(error, 'No se pudo registrar la cuota, intenta nuevamente') }
    }

    return {
      data: { fee_count: data.fee_count, late_fee_count: data.late_fee_count, total: Number(data.total) },
    }
  })

export const recordFeePayment = (input: RecordFeePaymentInput) => recordFeePaymentFn({ data: input })

const createTransactionFn = createServerFn({ method: 'POST' })
  .validator((input: CreateTransactionInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
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

    // Fees need a fee_month and the period's rates, terraza rows their booking;
    // only the RPCs know how.
    const { data: category } = await supabase
      .from('transaction_categories')
      .select('key')
      .eq('id', category_id)
      .maybeSingle()
    if (category?.key) {
      return { error: systemCategoryMessage(category.key) }
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
      if (error.code === FK_VIOLATION) {
        return { error: 'La categoría no corresponde al tipo de movimiento' }
      }
      return { error: toMessage(error, 'No se pudo registrar el movimiento, intenta nuevamente') }
    }

    return { data }
  })

export const createTransaction = (input: CreateTransactionInput) => createTransactionFn({ data: input })

const updateTransactionFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: UpdateTransactionInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ id: string }>> => {
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
    // rates and due day, terraza rows from their booking. Editing their amount,
    // date, month or house here would silently break that; only the receipt
    // details can change. Anything else is fixed by deleting the receipt and
    // recording it again.
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
      return { error: systemCategoryMessage(category.key) }
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
      if (error.code === FK_VIOLATION) {
        return { error: 'La categoría no corresponde al tipo de movimiento' }
      }
      return { error: toMessage(error, 'No se pudo actualizar el movimiento, intenta nuevamente') }
    }

    return { data }
  })

export const updateTransaction = (id: string, input: UpdateTransactionInput) =>
  updateTransactionFn({ data: { id, input } })

/**
 * Soft-deletes movements (sets deleted_at; a DB trigger stamps deleted_by).
 * Returns how many rows were affected: RLS doesn't raise on UPDATE, it just
 * filters rows out, so a short count means no permission.
 */
const deleteTransactionsFn = createServerFn({ method: 'POST' })
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ deleted: number }>> => {
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
  })

export const deleteTransactions = (ids: string[]) => deleteTransactionsFn({ data: ids })

/**
 * Undoes a soft delete. Fails with 23505 if the same fee month was re-recorded
 * meanwhile, or 23P01 if its folio went to another receipt.
 */
const restoreTransactionsFn = createServerFn({ method: 'POST' })
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ restored: number }>> => {
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
        error:
          error.code === UNIQUE_VIOLATION || isFolioTaken(error)
            ? `No se pudo restaurar: ${message.toLowerCase()}`
            : message,
      }
    }

    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: { restored: data.length } }
  })

export const restoreTransactions = (ids: string[]) => restoreTransactionsFn({ data: ids })

// ---------------------------------------------------------------------------
// categories
// ---------------------------------------------------------------------------

const createCategoryFn = createServerFn({ method: 'POST' })
  .validator((input: CategoryInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = categorySchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('transaction_categories')
      .insert(parsed.data)
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo crear la categoría, intenta nuevamente') }
    }

    return { data }
  })

export const createCategory = (input: CategoryInput) => createCategoryFn({ data: input })

/** Renames a category. Its kind is fixed: movements already point at it. */
const updateCategoryFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: Pick<CategoryInput, 'name'> }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = categorySchema.pick({ name: true }).safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('transaction_categories')
      .update(parsed.data)
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo actualizar la categoría, intenta nuevamente') }
    }
    if (!data) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const updateCategory = (id: string, input: Pick<CategoryInput, 'name'>) =>
  updateCategoryFn({ data: { id, input } })

/** Retire / reinstate. Retired categories stay on past movements but leave the pickers. */
const setCategoryActiveFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; isActive: boolean }) => data)
  .handler(async ({ data: { id, isActive } }): Promise<ActionResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('transaction_categories')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      // transaction_categories_system_active: fee / late fee can't be retired.
      if (error.code === CHECK_VIOLATION) {
        return { error: 'Esta categoría la usa el sistema para las cuotas y no se puede desactivar' }
      }
      return { error: toMessage(error, 'No se pudo actualizar la categoría, intenta nuevamente') }
    }
    if (!data) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const setCategoryActive = (id: string, isActive: boolean) =>
  setCategoryActiveFn({ data: { id, isActive } })

/** Hard delete; only possible while nothing references the category. */
const deleteCategoryFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('transaction_categories').delete().eq('id', id).select('id')

    if (error) {
      if (error.code === FK_VIOLATION) {
        return { error: 'No se puede eliminar: hay movimientos con esta categoría. Desactívala en su lugar.' }
      }
      return { error: toMessage(error, 'No se pudo eliminar la categoría, intenta nuevamente') }
    }
    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const deleteCategory = (id: string) => deleteCategoryFn({ data: id })

// ---------------------------------------------------------------------------
// periods
// ---------------------------------------------------------------------------

function periodErrorMessage(error: PostgrestError, fallback: string) {
  // periods_no_overlap: two periods can't cover the same day.
  if (error.code === EXCLUSION_VIOLATION) {
    return 'Las fechas se traslapan con otro periodo'
  }
  return toMessage(error, fallback)
}

const createPeriodFn = createServerFn({ method: 'POST' })
  .validator((input: PeriodInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = periodSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from('periods').insert(parsed.data).select('id').single()

    if (error) {
      return { error: periodErrorMessage(error, 'No se pudo crear el periodo, intenta nuevamente') }
    }

    return { data }
  })

export const createPeriod = (input: PeriodInput) => createPeriodFn({ data: input })

const updatePeriodFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: PeriodInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = periodSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('periods')
      .update(parsed.data)
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: periodErrorMessage(error, 'No se pudo actualizar el periodo, intenta nuevamente') }
    }
    if (!data) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const updatePeriod = (id: string, input: PeriodInput) => updatePeriodFn({ data: { id, input } })

/** Hard delete; only possible while the period has no movements. */
const deletePeriodFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('periods').delete().eq('id', id).select('id')

    if (error) {
      if (error.code === FK_VIOLATION) {
        return { error: 'No se puede eliminar: el periodo ya tiene movimientos registrados' }
      }
      return { error: toMessage(error, 'No se pudo eliminar el periodo, intenta nuevamente') }
    }
    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const deletePeriod = (id: string) => deletePeriodFn({ data: id })

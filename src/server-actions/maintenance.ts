import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import {
  type ActionResult,
  FK_VIOLATION,
  postgrestErrorMessage,
  requestResolutionErrorMessage,
} from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import { type MaintenanceRequestInput, maintenanceRequestSchema } from '@/lib/validations/maintenance'
import {
  type PayRequestInput,
  payRequestSchema,
  type RejectRequestInput,
  rejectRequestSchema,
} from '@/lib/validations/requests'

function toMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, { fallback })
}

const createMaintenanceRequestFn = createServerFn({ method: 'POST' })
  .validator((input: MaintenanceRequestInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = maintenanceRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { title, details, amount, requested_on } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({ title, details: details || null, amount, requested_on })
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo registrar la solicitud, intenta nuevamente') }
    }

    return { data }
  })

export const createMaintenanceRequest = (input: MaintenanceRequestInput) =>
  createMaintenanceRequestFn({ data: input })

/** Only while pending: RLS filters out resolved rows, which surfaces as "no permission". */
const updateMaintenanceRequestFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: MaintenanceRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = maintenanceRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { title, details, amount, requested_on } = parsed.data
    const supabase = await createClient()

    const { error } = await supabase
      .from('maintenance_requests')
      .update({ title, details: details || null, amount, requested_on })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo actualizar la solicitud, intenta nuevamente') }
    }

    return { data: undefined }
  })

export const updateMaintenanceRequest = (id: string, input: MaintenanceRequestInput) =>
  updateMaintenanceRequestFn({ data: { id, input } })

const deleteMaintenanceRequestFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    const supabase = await createClient()

    const { error } = await supabase.from('maintenance_requests').delete().eq('id', id).select('id').single()

    if (error) {
      return { error: toMessage(error, 'No se pudo eliminar la solicitud, intenta nuevamente') }
    }

    return { data: undefined }
  })

export const deleteMaintenanceRequest = (id: string) => deleteMaintenanceRequestFn({ data: id })

/** Records the expense in the ledger and marks the request paid, atomically. */
const payMaintenanceRequestFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: PayRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ transaction_id: string }>> => {
    const parsed = payRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { category_id, occurred_on, payment_method, reference, notes } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('pay_maintenance_request', {
      p_request_id: id,
      p_category_id: category_id,
      p_occurred_on: occurred_on,
      p_payment_method: payment_method,
      p_reference: reference || undefined,
      p_notes: notes || undefined,
    })

    if (error) {
      if (error.code === FK_VIOLATION) return { error: 'La categoría debe ser de egreso' }
      return {
        error: requestResolutionErrorMessage(error, 'No se pudo registrar el pago, intenta nuevamente'),
      }
    }

    return { data: { transaction_id: data } }
  })

export const payMaintenanceRequest = (id: string, input: PayRequestInput) =>
  payMaintenanceRequestFn({ data: { id, input } })

const rejectMaintenanceRequestFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: RejectRequestInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = rejectRequestSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const supabase = await createClient()

    const { error } = await supabase.rpc('reject_maintenance_request', {
      p_request_id: id,
      p_reason: parsed.data.reason,
    })

    if (error) {
      return {
        error: requestResolutionErrorMessage(error, 'No se pudo rechazar la solicitud, intenta nuevamente'),
      }
    }

    return { data: undefined }
  })

export const rejectMaintenanceRequest = (id: string, input: RejectRequestInput) =>
  rejectMaintenanceRequestFn({ data: { id, input } })

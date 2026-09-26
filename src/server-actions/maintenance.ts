'use server'

import type { PostgrestError } from '@supabase/supabase-js'
import { type ActionResult, postgrestErrorMessage } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import {
  type MaintenanceRequestInput,
  maintenanceRequestSchema,
  type PayRequestInput,
  payRequestSchema,
  type RejectRequestInput,
  rejectRequestSchema,
} from '@/lib/validations/maintenance'

// Raised by the RPCs.
const NOT_FOUND = 'P0002'
const ALREADY_RESOLVED = 'P0003'
const FK_VIOLATION = '23503'

function toMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, { fallback })
}

export async function createMaintenanceRequest(
  input: MaintenanceRequestInput,
): Promise<ActionResult<{ id: string }>> {
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
}

/** Only while pending: RLS filters out resolved rows, which surfaces as "no permission". */
export async function updateMaintenanceRequest(
  id: string,
  input: MaintenanceRequestInput,
): Promise<ActionResult> {
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
}

export async function deleteMaintenanceRequest(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.from('maintenance_requests').delete().eq('id', id).select('id').single()

  if (error) {
    return { error: toMessage(error, 'No se pudo eliminar la solicitud, intenta nuevamente') }
  }

  return { data: undefined }
}

function resolutionError(error: PostgrestError, fallback: string) {
  if (error.code === ALREADY_RESOLVED) return 'Esta solicitud ya fue resuelta por alguien más'
  if (error.code === NOT_FOUND && error.message.includes('no period')) {
    return 'Ningún periodo cubre esa fecha. Crea el periodo primero.'
  }
  if (error.code === NOT_FOUND) return 'La solicitud ya no existe'
  return toMessage(error, fallback)
}

/** Records the expense in the ledger and marks the request paid, atomically. */
export async function payMaintenanceRequest(
  id: string,
  input: PayRequestInput,
): Promise<ActionResult<{ transaction_id: string }>> {
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
    return { error: resolutionError(error, 'No se pudo registrar el pago, intenta nuevamente') }
  }

  return { data: { transaction_id: data } }
}

export async function rejectMaintenanceRequest(id: string, input: RejectRequestInput): Promise<ActionResult> {
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
    return { error: resolutionError(error, 'No se pudo rechazar la solicitud, intenta nuevamente') }
  }

  return { data: undefined }
}

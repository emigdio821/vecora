'use server'

import type { PostgrestError } from '@supabase/supabase-js'
import { type ActionResult, postgrestErrorMessage, requestResolutionErrorMessage } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import {
  type CancelHallReservationInput,
  cancelHallReservationSchema,
  type HallReservationInput,
  hallReservationSchema,
  type PayHallReservationInput,
  payHallReservationSchema,
} from '@/lib/validations/presidency'

// Raised by the guard trigger once a booking has money recorded against it.
const PAID = 'P0003'

function toMessage(error: PostgrestError, fallback: string) {
  if (error.code === PAID && error.message.includes('cancel it instead')) {
    return 'La reservación ya está pagada. El tesorero puede cancelarla y registrar el reembolso.'
  }
  if (error.code === PAID) {
    return 'La reservación ya está pagada: no se puede cambiar la casa ni el monto'
  }
  return postgrestErrorMessage(error, {
    fallback,
    unique: { hall_reservations_one_per_day: 'La terraza ya está reservada ese día' },
  })
}

/** Errors from pay_hall_reservation / cancel_hall_reservation. */
function toResolutionMessage(error: PostgrestError, fallback: string) {
  if (error.message.includes('already paid')) return 'Esta reservación ya tiene su pago registrado'
  if (error.message.includes('cancelled')) return 'Esta reservación ya fue cancelada'
  if (error.message.includes('no cost')) return 'Esta reservación es sin costo, no hay nada que cobrar'
  if (error.message.includes('exceeds')) return 'El reembolso no puede ser mayor a lo que se pagó'
  if (error.message.includes('not found')) return 'La reservación ya no existe'
  return requestResolutionErrorMessage(error, fallback)
}

export async function createHallReservation(
  input: HallReservationInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = hallReservationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { property_id, reserved_on, amount, notes } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hall_reservations')
    .insert({ property_id, reserved_on, amount, notes: notes || null })
    .select('id')
    .single()

  if (error) {
    return { error: toMessage(error, 'No se pudo registrar la reservación, intenta nuevamente') }
  }

  return { data }
}

/** Not once cancelled (RLS). Once paid, the guard trigger keeps the house and amount. */
export async function updateHallReservation(id: string, input: HallReservationInput): Promise<ActionResult> {
  const parsed = hallReservationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { property_id, reserved_on, amount, notes } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hall_reservations')
    .update({ property_id, reserved_on, amount, notes: notes || null })
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    return { error: toMessage(error, 'No se pudo actualizar la reservación, intenta nuevamente') }
  }
  if (!data) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  return { data: undefined }
}

/** Unpaid bookings only; a paid one is cancelled with cancelHallReservation. */
export async function deleteHallReservation(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('hall_reservations').delete().eq('id', id).select('id')

  if (error) {
    return { error: toMessage(error, 'No se pudo cancelar la reservación, intenta nuevamente') }
  }
  if (data.length === 0) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  return { data: undefined }
}

export async function payHallReservation(
  id: string,
  input: PayHallReservationInput,
): Promise<ActionResult<{ transaction_id: string }>> {
  const parsed = payHallReservationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { occurred_on, folio, payment_method, reference, notes } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('pay_hall_reservation', {
    p_reservation_id: id,
    p_occurred_on: occurred_on,
    p_folio: folio,
    p_payment_method: payment_method,
    p_reference: reference || undefined,
    p_notes: notes || undefined,
  })

  if (error) {
    return { error: toResolutionMessage(error, 'No se pudo registrar el pago, intenta nuevamente') }
  }

  return { data: { transaction_id: data } }
}

export async function cancelHallReservation(
  id: string,
  input: CancelHallReservationInput,
): Promise<ActionResult> {
  const parsed = cancelHallReservationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { refund_amount, occurred_on, payment_method, reference, notes } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_hall_reservation', {
    p_reservation_id: id,
    p_refund_amount: refund_amount,
    p_occurred_on: occurred_on,
    p_payment_method: payment_method,
    p_reference: reference || undefined,
    p_notes: notes || undefined,
  })

  if (error) {
    return { error: toResolutionMessage(error, 'No se pudo cancelar la reservación, intenta nuevamente') }
  }

  return { data: undefined }
}

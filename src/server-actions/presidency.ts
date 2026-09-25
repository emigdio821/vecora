'use server'

import type { PostgrestError } from '@supabase/supabase-js'
import { type ActionResult, postgrestErrorMessage } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import { type HallReservationInput, hallReservationSchema } from '@/lib/validations/presidency'

function toMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, {
    fallback,
    unique: { hall_reservations_one_per_day: 'La terraza ya está reservada ese día' },
  })
}

export async function createHallReservation(
  input: HallReservationInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = hallReservationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { property_id, reserved_on, notes } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hall_reservations')
    .insert({ property_id, reserved_on, notes: notes || null })
    .select('id')
    .single()

  if (error) {
    return { error: toMessage(error, 'No se pudo registrar la reservación, intenta nuevamente') }
  }

  return { data }
}

export async function updateHallReservation(id: string, input: HallReservationInput): Promise<ActionResult> {
  const parsed = hallReservationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { property_id, reserved_on, notes } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hall_reservations')
    .update({ property_id, reserved_on, notes: notes || null })
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

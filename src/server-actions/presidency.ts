import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import {
  type ActionResult,
  FK_VIOLATION,
  FOLIO_TAKEN_MESSAGE,
  isFolioTaken,
  postgrestErrorMessage,
  requestResolutionErrorMessage,
} from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import {
  type AmenityInput,
  amenitySchema,
  type CancelReservationInput,
  cancelReservationSchema,
  type PayReservationInput,
  payReservationSchema,
  type ReservationInput,
  reservationSchema,
} from '@/lib/validations/presidency'

// ---------------------------------------------------------------------------
// amenities
// ---------------------------------------------------------------------------

function toAmenityMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, {
    fallback,
    unique: { amenities_name_unique: 'Ya existe un área con ese nombre' },
  })
}

const createAmenityFn = createServerFn({ method: 'POST' })
  .validator((input: AmenityInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = amenitySchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from('amenities').insert(parsed.data).select('id').single()

    if (error) {
      return { error: toAmenityMessage(error, 'No se pudo crear el área, intenta nuevamente') }
    }

    return { data }
  })

export const createAmenity = (input: AmenityInput) => createAmenityFn({ data: input })

/** Past bookings keep their amount; the new fee applies from the next one. */
const updateAmenityFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: AmenityInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = amenitySchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('amenities')
      .update(parsed.data)
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toAmenityMessage(error, 'No se pudo actualizar el área, intenta nuevamente') }
    }
    if (!data) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const updateAmenity = (id: string, input: AmenityInput) => updateAmenityFn({ data: { id, input } })

/** Retire / reinstate. Retired areas keep their bookings but leave the booking form. */
const setAmenityActiveFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; isActive: boolean }) => data)
  .handler(async ({ data: { id, isActive } }): Promise<ActionResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('amenities')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toAmenityMessage(error, 'No se pudo actualizar el área, intenta nuevamente') }
    }
    if (!data) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const setAmenityActive = (id: string, isActive: boolean) =>
  setAmenityActiveFn({ data: { id, isActive } })

/** Hard delete; only possible while the area has no bookings. */
const deleteAmenityFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('amenities').delete().eq('id', id).select('id')

    if (error) {
      if (error.code === FK_VIOLATION) {
        return { error: 'No se puede eliminar: el área tiene reservaciones. Desactívala en su lugar.' }
      }
      return { error: toAmenityMessage(error, 'No se pudo eliminar el área, intenta nuevamente') }
    }
    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const deleteAmenity = (id: string) => deleteAmenityFn({ data: id })

// ---------------------------------------------------------------------------
// reservations
// ---------------------------------------------------------------------------

// Raised by the guard trigger once a booking has money recorded against it.
const PAID = 'P0003'

function toMessage(error: PostgrestError, fallback: string) {
  if (error.code === PAID && error.message.includes('cancel it instead')) {
    return 'La reservación ya está pagada. El tesorero puede cancelarla y registrar el reembolso.'
  }
  if (error.code === PAID) {
    return 'La reservación ya está pagada: no se puede cambiar el área, la casa ni el monto'
  }
  return postgrestErrorMessage(error, {
    fallback,
    unique: { amenity_reservations_one_per_day: 'El área ya está reservada ese día' },
  })
}

/** Errors from pay_amenity_reservation / cancel_amenity_reservation. */
function toResolutionMessage(error: PostgrestError, fallback: string) {
  if (isFolioTaken(error)) return FOLIO_TAKEN_MESSAGE
  if (error.message.includes('already paid')) return 'Esta reservación ya tiene su pago registrado'
  if (error.message.includes('cancelled')) return 'Esta reservación ya fue cancelada'
  if (error.message.includes('no cost')) return 'Esta reservación es sin costo, no hay nada que cobrar'
  if (error.message.includes('exceeds')) return 'El reembolso no puede ser mayor a lo que se pagó'
  if (error.message.includes('not found')) return 'La reservación ya no existe'
  return requestResolutionErrorMessage(error, fallback)
}

const createReservationFn = createServerFn({ method: 'POST' })
  .validator((input: ReservationInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { amenity_id, property_id, reserved_on, amount, notes } = parsed.data
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('amenity_reservations')
      .insert({ amenity_id, property_id, reserved_on, amount, notes: notes || null })
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo registrar la reservación, intenta nuevamente') }
    }

    return { data }
  })

export const createReservation = (input: ReservationInput) => createReservationFn({ data: input })

/** Not once cancelled (RLS). Once paid, the guard trigger keeps the area, house and amount. */
const updateReservationFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: ReservationInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { amenity_id, property_id, reserved_on, amount, notes } = parsed.data
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('amenity_reservations')
      .update({ amenity_id, property_id, reserved_on, amount, notes: notes || null })
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
  })

export const updateReservation = (id: string, input: ReservationInput) =>
  updateReservationFn({ data: { id, input } })

/** Unpaid bookings only; a paid one is cancelled with cancelReservation. */
const deleteReservationFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('amenity_reservations').delete().eq('id', id).select('id')

    if (error) {
      return { error: toMessage(error, 'No se pudo cancelar la reservación, intenta nuevamente') }
    }
    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: undefined }
  })

export const deleteReservation = (id: string) => deleteReservationFn({ data: id })

const payReservationFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: PayReservationInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ transaction_id: string }>> => {
    const parsed = payReservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { occurred_on, folio, payment_method, reference, notes } = parsed.data
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('pay_amenity_reservation', {
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
  })

export const payReservation = (id: string, input: PayReservationInput) =>
  payReservationFn({ data: { id, input } })

const cancelReservationFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: CancelReservationInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = cancelReservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { refund_amount, occurred_on, payment_method, reference, notes } = parsed.data
    const supabase = await createClient()
    const { error } = await supabase.rpc('cancel_amenity_reservation', {
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
  })

export const cancelReservation = (id: string, input: CancelReservationInput) =>
  cancelReservationFn({ data: { id, input } })

import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import {
  type ActionResult,
  FK_VIOLATION,
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
import { m } from '@/paraglide/messages'

// ---------------------------------------------------------------------------
// amenities
// ---------------------------------------------------------------------------

function toAmenityMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, {
    fallback,
    unique: { amenities_name_unique: m.presidency_error_amenity_name_taken() },
  })
}

const createAmenityFn = createServerFn({ method: 'POST' })
  .validator((input: AmenityInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = amenitySchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from('amenities').insert(parsed.data).select('id').single()

    if (error) {
      return { error: toAmenityMessage(error, m.presidency_error_create_amenity()) }
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
      return { error: m.common_form_invalid() }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('amenities')
      .update(parsed.data)
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toAmenityMessage(error, m.presidency_error_update_amenity()) }
    }
    if (!data) {
      return { error: m.common_no_permission() }
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
      return { error: toAmenityMessage(error, m.presidency_error_update_amenity()) }
    }
    if (!data) {
      return { error: m.common_no_permission() }
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
        return { error: m.presidency_error_amenity_in_use() }
      }
      return { error: toAmenityMessage(error, m.presidency_error_delete_amenity()) }
    }
    if (data.length === 0) {
      return { error: m.common_no_permission() }
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
    return m.presidency_error_reservation_paid_cancel()
  }
  if (error.code === PAID) {
    return m.presidency_error_reservation_paid_locked()
  }
  return postgrestErrorMessage(error, {
    fallback,
    unique: { amenity_reservations_one_per_day: m.presidency_error_day_taken() },
  })
}

/** Errors from pay_amenity_reservation / cancel_amenity_reservation. */
function toResolutionMessage(error: PostgrestError, fallback: string) {
  if (isFolioTaken(error)) return m.common_folio_taken()
  if (error.message.includes('already paid')) return m.presidency_error_already_paid()
  if (error.message.includes('cancelled')) return m.presidency_error_already_cancelled()
  if (error.message.includes('no cost')) return m.presidency_error_no_cost()
  if (error.message.includes('exceeds')) return m.presidency_error_refund_exceeds()
  if (error.message.includes('not found')) return m.presidency_error_reservation_not_found()
  return requestResolutionErrorMessage(error, fallback)
}

const createReservationFn = createServerFn({ method: 'POST' })
  .validator((input: ReservationInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { amenity_id, property_id, reserved_on, amount, notes } = parsed.data
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('amenity_reservations')
      .insert({ amenity_id, property_id, reserved_on, amount, notes: notes || null })
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, m.presidency_error_create_reservation()) }
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
      return { error: m.common_form_invalid() }
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
      return { error: toMessage(error, m.presidency_error_update_reservation()) }
    }
    if (!data) {
      return { error: m.common_no_permission() }
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
      return { error: toMessage(error, m.presidency_error_cancel_reservation()) }
    }
    if (data.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deleteReservation = (id: string) => deleteReservationFn({ data: id })

const payReservationFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: PayReservationInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ transaction_id: string }>> => {
    const parsed = payReservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
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
      return { error: toResolutionMessage(error, m.presidency_error_record_payment()) }
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
      return { error: m.common_form_invalid() }
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
      return { error: toResolutionMessage(error, m.presidency_error_cancel_reservation()) }
    }

    return { data: undefined }
  })

export const cancelReservation = (id: string, input: CancelReservationInput) =>
  cancelReservationFn({ data: { id, input } })

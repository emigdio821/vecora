import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { type ActionResult, postgrestErrorMessage, UNIQUE_VIOLATION } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import {
  type CreateResidentInput,
  createResidentSchema,
  type UpdateResidentInput,
  updateResidentSchema,
} from '@/lib/validations/residents'

function toMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, {
    fallback,
    unique: {
      residents_email_unique: 'Ya existe un residente con ese correo',
      residents_email_account: 'Ese correo ya lo usa una cuenta de la mesa directiva',
    },
    uniqueFallback: 'Ya existe un residente con esos datos',
  })
}

const createResidentFn = createServerFn({ method: 'POST' })
  .validator((input: CreateResidentInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createResidentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { first_name, last_name, phone, email, notes, property_id, relationship } = parsed.data
    const supabase = await createClient()

    // RPC so the resident and their house link are created in one transaction.
    const { data, error } = await supabase.rpc('create_resident', {
      p_first_name: first_name,
      p_last_name: last_name,
      p_phone: phone,
      p_email: email || undefined,
      p_notes: notes || undefined,
      p_property_id: property_id || undefined,
      p_relationship: property_id ? relationship : undefined,
    })

    if (error) {
      // P0002: raised by the RPC for a missing/soft-deleted house; 23503: FK race.
      if (error.code === 'P0002' || error.code === '23503') {
        return { error: 'La casa seleccionada ya no existe' }
      }
      return { error: toMessage(error, 'No se pudo crear el residente, intenta nuevamente') }
    }

    return { data: { id: data } }
  })

export const createResident = (input: CreateResidentInput) => createResidentFn({ data: input })

const updateResidentFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: UpdateResidentInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateResidentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { email, notes, ...rest } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('residents')
      .update({ ...rest, email: email || null, notes: notes || null })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo actualizar el residente, intenta nuevamente') }
    }

    return { data }
  })

export const updateResident = (id: string, input: UpdateResidentInput) =>
  updateResidentFn({ data: { id, input } })

/**
 * Soft-deletes one or more residents (sets deleted_at; a DB trigger stamps
 * deleted_by). Returns how many rows were affected: RLS doesn't raise on
 * UPDATE, it just filters rows out, so a short count means no permission.
 */
const deleteResidentsFn = createServerFn({ method: 'POST' })
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: 'Selecciona al menos un residente' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('residents')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', uniqueIds)
      .is('deleted_at', null)
      .select('id')

    if (error) {
      return { error: toMessage(error, 'No se pudieron eliminar los residentes, intenta nuevamente') }
    }

    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: { deleted: data.length } }
  })

export const deleteResidents = (ids: string[]) => deleteResidentsFn({ data: ids })

/** Undoes a soft delete. Fails with 23505 if the email was reused meanwhile. */
const restoreResidentsFn = createServerFn({ method: 'POST' })
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ restored: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: 'Nada que restaurar' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('residents')
      .update({ deleted_at: null })
      .in('id', uniqueIds)
      .not('deleted_at', 'is', null)
      .select('id')

    if (error) {
      const message = toMessage(error, 'No se pudieron restaurar los residentes, intenta nuevamente')
      return {
        error: error.code === UNIQUE_VIOLATION ? `No se pudo restaurar: ${message.toLowerCase()}` : message,
      }
    }

    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: { restored: data.length } }
  })

export const restoreResidents = (ids: string[]) => restoreResidentsFn({ data: ids })

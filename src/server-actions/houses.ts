import type { PostgrestError } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { type ActionResult, postgrestErrorMessage, UNIQUE_VIOLATION } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import {
  type AssignResidentsInput,
  assignResidentsSchema,
  type CreateHouseInput,
  createHouseSchema,
  type UpdateHouseInput,
  updateHouseSchema,
} from '@/lib/validations/houses'

// "House" in the app, `properties` in the database.

function toMessage(error: PostgrestError, fallback: string) {
  return postgrestErrorMessage(error, {
    fallback,
    unique: { properties_number_unique: 'Ya existe una casa con ese número' },
    uniqueFallback: 'Ya existe una casa con esos datos',
  })
}

const createHouseFn = createServerFn({ method: 'POST' })
  .validator((input: CreateHouseInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { notes, ...rest } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('properties')
      .insert({ ...rest, notes: notes || null })
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo crear la casa, intenta nuevamente') }
    }

    return { data }
  })

export const createHouse = (input: CreateHouseInput) => createHouseFn({ data: input })

const updateHouseFn = createServerFn({ method: 'POST' })
  .validator((data: { id: string; input: UpdateHouseInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { notes, ...rest } = parsed.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('properties')
      .update({ ...rest, notes: notes || null })
      .eq('id', id)
      .select('id')
      .single()

    if (error) {
      return { error: toMessage(error, 'No se pudo actualizar la casa, intenta nuevamente') }
    }

    return { data }
  })

export const updateHouse = (id: string, input: UpdateHouseInput) => updateHouseFn({ data: { id, input } })

/**
 * Soft-deletes one or more houses (sets deleted_at; a DB trigger stamps
 * deleted_by). Returns how many rows were affected: RLS doesn't raise on
 * UPDATE, it just filters rows out, so a short count means no permission.
 */
const deleteHousesFn = createServerFn({ method: 'POST' })
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: 'Selecciona al menos una casa' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('properties')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', uniqueIds)
      .is('deleted_at', null)
      .select('id')

    if (error) {
      return { error: toMessage(error, 'No se pudieron eliminar las casas, intenta nuevamente') }
    }

    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: { deleted: data.length } }
  })

export const deleteHouses = (ids: string[]) => deleteHousesFn({ data: ids })

/** Undoes a soft delete. Fails with 23505 if the number was reused meanwhile. */
const restoreHousesFn = createServerFn({ method: 'POST' })
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ restored: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: 'Nada que restaurar' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('properties')
      .update({ deleted_at: null })
      .in('id', uniqueIds)
      .not('deleted_at', 'is', null)
      .select('id')

    if (error) {
      const message = toMessage(error, 'No se pudieron restaurar las casas, intenta nuevamente')
      return {
        error: error.code === UNIQUE_VIOLATION ? `No se pudo restaurar: ${message.toLowerCase()}` : message,
      }
    }

    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: { restored: data.length } }
  })

export const restoreHouses = (ids: string[]) => restoreHousesFn({ data: ids })

/** Links residents to a house with one relationship for the whole batch. */
const assignResidentsFn = createServerFn({ method: 'POST' })
  .validator((data: { houseId: string; input: AssignResidentsInput }) => data)
  .handler(async ({ data: { houseId, input } }): Promise<ActionResult<{ assigned: number }>> => {
    const parsed = assignResidentsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: 'Revisa los campos del formulario' }
    }

    const { relationship } = parsed.data
    const residentIds = [...new Set(parsed.data.residentIds)]
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('property_residents')
      .insert(residentIds.map((resident_id) => ({ property_id: houseId, resident_id, relationship })))
      .select('resident_id')

    if (error) {
      return {
        error: postgrestErrorMessage(error, {
          fallback: 'No se pudieron asignar los residentes, intenta nuevamente',
          uniqueFallback: 'Alguno de los residentes ya está asignado a esta casa',
        }),
      }
    }

    return { data: { assigned: data.length } }
  })

export const assignResidents = (houseId: string, input: AssignResidentsInput) =>
  assignResidentsFn({ data: { houseId, input } })

/** Removes a resident from a house. The link is history, so this is only for mistakes. */
const unassignResidentFn = createServerFn({ method: 'POST' })
  .validator((data: { houseId: string; residentId: string }) => data)
  .handler(async ({ data: { houseId, residentId } }): Promise<ActionResult<{ removed: number }>> => {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('property_residents')
      .delete()
      .eq('property_id', houseId)
      .eq('resident_id', residentId)
      .select('resident_id')

    if (error) {
      return {
        error: postgrestErrorMessage(error, {
          fallback: 'No se pudo quitar al residente, intenta nuevamente',
        }),
      }
    }

    // RLS filters instead of raising on DELETE, so 0 rows means no permission (or already gone).
    if (data.length === 0) {
      return { error: 'No tienes permisos para realizar esta acción' }
    }

    return { data: { removed: data.length } }
  })

export const unassignResident = (houseId: string, residentId: string) =>
  unassignResidentFn({ data: { houseId, residentId } })

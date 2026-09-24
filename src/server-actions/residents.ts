'use server'

import type { PostgrestError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  type CreateResidentInput,
  createResidentSchema,
  type UpdateResidentInput,
  updateResidentSchema,
} from '@/lib/validations/residents'

export type ActionResult<T = undefined> = { data: T; error?: never } | { data?: never; error: string }

const RLS_VIOLATION = '42501'
// PostgREST: `.single()` found no row. After an UPDATE this means RLS filtered
// it out (Postgres reports 0 rows instead of an error in that case).
const NO_ROWS = 'PGRST116'
const UNIQUE_VIOLATION = '23505'

// Postgres names the violated constraint in the message:
// `duplicate key value violates unique constraint "residents_email_unique"`.
const UNIQUE_MESSAGES: Record<string, string> = {
  residents_email_unique: 'Ya existe un residente con ese correo',
}

function toMessage(error: PostgrestError, fallback: string) {
  switch (error.code) {
    case RLS_VIOLATION:
    case NO_ROWS:
      return 'No tienes permisos para realizar esta acción'
    case UNIQUE_VIOLATION: {
      const constraint = Object.keys(UNIQUE_MESSAGES).find((name) => error.message.includes(name))
      return constraint ? UNIQUE_MESSAGES[constraint] : 'Ya existe un residente con esos datos'
    }
    default:
      return fallback
  }
}

export async function createResident(input: CreateResidentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = createResidentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const { email, notes, ...rest } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('residents')
    .insert({ ...rest, email: email || null, notes: notes || null })
    .select('id')
    .single()

  if (error) {
    return { error: toMessage(error, 'No se pudo crear el residente, intenta nuevamente') }
  }

  return { data }
}

export async function updateResident(
  id: string,
  input: UpdateResidentInput,
): Promise<ActionResult<{ id: string }>> {
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
}

/**
 * Soft-deletes one or more residents (sets deleted_at; a DB trigger stamps
 * deleted_by). Returns how many rows were affected: RLS doesn't raise on
 * UPDATE, it just filters rows out, so a short count means no permission.
 */
export async function deleteResidents(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
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
}

/** Undoes a soft delete. Fails with 23505 if the email was reused meanwhile. */
export async function restoreResidents(ids: string[]): Promise<ActionResult<{ restored: number }>> {
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
}

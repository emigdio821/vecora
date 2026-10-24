import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import {
  type ActionResult,
  databaseError,
  postgrestErrorMessage,
  UNIQUE_VIOLATION,
} from '@/lib/action-result'
import { authMiddleware } from '@/lib/auth/middleware'
import { withCurrentUser } from '@/lib/db/current-user'
import { residents } from '@/lib/db/schema'
import {
  type CreateResidentInput,
  createResidentSchema,
  type UpdateResidentInput,
  updateResidentSchema,
} from '@/lib/validations/residents'
import { m } from '@/paraglide/messages'

function toMessage(error: unknown, fallback: string) {
  return postgrestErrorMessage(databaseError(error), {
    fallback,
    unique: {
      residents_email_unique: m.residential_resident_email_taken(),
      residents_email_account: m.residential_resident_email_account(),
    },
    uniqueFallback: m.residential_resident_duplicate(),
  })
}

/**
 * The residents, their board account if any, and their houses, last changed first.
 * The rows keep the database's column names and ISO timestamps, the shape the
 * screens were built on.
 */
const fetchResidentsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const list = await withCurrentUser((tx) =>
      tx.query.residents.findMany({
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          profileProfileId: {
            columns: { id: true, fullName: true },
            with: { userRolesUserId: { columns: { role: true } } },
          },
          propertyResidents: {
            columns: { relationship: true },
            with: { property: { columns: { id: true, number: true } } },
            // Soft-deleted houses keep their links (so undo restores them), but they're not shown.
            where: { property: { deletedAt: { isNull: true } } },
          },
        },
        where: { deletedAt: { isNull: true } },
        orderBy: { updatedAt: 'desc' },
      }),
    )

    return list.map((resident) => {
      const profile = resident.profileProfileId
      return {
        id: resident.id,
        first_name: resident.firstName,
        last_name: resident.lastName,
        phone: resident.phone,
        email: resident.email,
        notes: resident.notes,
        created_at: resident.createdAt.toISOString(),
        updated_at: resident.updatedAt.toISOString(),
        profile: profile
          ? {
              id: profile.id,
              full_name: profile.fullName,
              user_roles: profile.userRolesUserId.map((grant) => ({ role: grant.role })),
            }
          : null,
        property_residents: resident.propertyResidents.flatMap((link) => {
          // Always there after the filter above; Drizzle types the join as optional anyway.
          if (!link.property) {
            return []
          }
          return [
            {
              relationship: link.relationship,
              property: { id: link.property.id, number: link.property.number },
            },
          ]
        }),
      }
    })
  })

export const fetchResidents = () => fetchResidentsFn()

/**
 * Lightweight list for pickers: identity + which houses each resident is
 * linked to. `email` is there for the board picker (an account needs one).
 */
const fetchResidentsPickerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const list = await withCurrentUser((tx) =>
      tx.query.residents.findMany({
        columns: { id: true, firstName: true, lastName: true, email: true },
        with: {
          propertyResidents: {
            columns: {},
            with: { property: { columns: { id: true, number: true } } },
            where: { property: { deletedAt: { isNull: true } } },
          },
        },
        where: { deletedAt: { isNull: true } },
        orderBy: { firstName: 'asc', lastName: 'asc' },
      }),
    )

    return list.map((resident) => ({
      id: resident.id,
      first_name: resident.firstName,
      last_name: resident.lastName,
      email: resident.email,
      property_residents: resident.propertyResidents.flatMap((link) => {
        if (!link.property) {
          return []
        }
        return [{ property: { id: link.property.id, number: link.property.number } }]
      }),
    }))
  })

export const fetchResidentsPicker = () => fetchResidentsPickerFn()

const createResidentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: CreateResidentInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createResidentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { first_name, last_name, phone, email, notes, property_id, relationship } = parsed.data

    let residentId: string
    try {
      // An SQL function so the resident and their house link are created in one transaction.
      const result = await withCurrentUser((tx) =>
        tx.execute<{ id: string }>(sql`
          select public.create_resident(
            p_first_name => ${first_name},
            p_last_name => ${last_name},
            p_phone => ${phone},
            p_email => ${email || null},
            p_notes => ${notes || null},
            p_property_id => ${property_id || null},
            p_relationship => ${property_id ? relationship : null}
          ) as id
        `),
      )
      residentId = result.rows[0].id
    } catch (error) {
      const failure = databaseError(error)
      // P0002: raised by the function for a missing/soft-deleted house; 23503: FK race.
      if (failure.code === 'P0002' || failure.code === '23503') {
        return { error: m.residential_selected_house_missing() }
      }
      return { error: toMessage(error, m.residential_create_resident_failed()) }
    }

    return { data: { id: residentId } }
  })

export const createResident = (input: CreateResidentInput) => createResidentFn({ data: input })

const updateResidentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: UpdateResidentInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateResidentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { first_name, last_name, phone, email, notes } = parsed.data

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(residents)
          .set({
            firstName: first_name,
            lastName: last_name,
            phone,
            email: email || null,
            notes: notes || null,
          })
          .where(eq(residents.id, id))
          .returning({ id: residents.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_update_resident_failed()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: updated[0] }
  })

export const updateResident = (id: string, input: UpdateResidentInput) =>
  updateResidentFn({ data: { id, input } })

/**
 * Soft-deletes one or more residents (sets deleted_at; a DB trigger stamps
 * deleted_by). Returns how many rows were affected: RLS doesn't raise on
 * UPDATE, it just filters rows out, so a short count means no permission.
 */
const deleteResidentsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.residential_select_resident_required() }
    }

    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx
          .update(residents)
          .set({ deletedAt: sql`now()` })
          .where(and(inArray(residents.id, uniqueIds), isNull(residents.deletedAt)))
          .returning({ id: residents.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_delete_residents_failed()) }
    }

    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: { deleted: deleted.length } }
  })

export const deleteResidents = (ids: string[]) => deleteResidentsFn({ data: ids })

/** Undoes a soft delete. Fails with 23505 if the email was reused meanwhile. */
const restoreResidentsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ restored: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.common_nothing_to_restore() }
    }

    let restored: Array<{ id: string }>
    try {
      restored = await withCurrentUser((tx) =>
        tx
          .update(residents)
          .set({ deletedAt: null })
          .where(and(inArray(residents.id, uniqueIds), isNotNull(residents.deletedAt)))
          .returning({ id: residents.id }),
      )
    } catch (error) {
      const message = toMessage(error, m.residential_restore_residents_failed())
      return {
        error:
          databaseError(error).code === UNIQUE_VIOLATION
            ? m.residential_restore_failed_reason({ reason: message.toLowerCase() })
            : message,
      }
    }

    if (restored.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: { restored: restored.length } }
  })

export const restoreResidents = (ids: string[]) => restoreResidentsFn({ data: ids })

import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import {
  type ActionResult,
  databaseError,
  postgrestErrorMessage,
  UNIQUE_VIOLATION,
} from '@/lib/action-result'
import { withCurrentUser } from '@/lib/db/current-user'
import { properties, propertyResidents } from '@/lib/db/schema'
import { authMiddleware } from '@/lib/supabase/auth-middleware'
import {
  type AssignResidentsInput,
  assignResidentsSchema,
  type CreateHouseInput,
  createHouseSchema,
  type UpdateHouseInput,
  type UpdateRelationshipInput,
  updateHouseSchema,
  updateRelationshipSchema,
} from '@/lib/validations/houses'
import { m } from '@/paraglide/messages'

// "House" in the app, `properties` in the database.

function toMessage(error: unknown, fallback: string) {
  return postgrestErrorMessage(databaseError(error), {
    fallback,
    unique: { properties_number_unique: m.residential_house_number_taken() },
    uniqueFallback: m.residential_house_duplicate(),
  })
}

/**
 * The houses and who lives in each, last changed first. The rows keep the
 * database's column names and ISO timestamps, the shape the screens were built on.
 */
const fetchHousesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const houses = await withCurrentUser((tx) =>
      tx.query.properties.findMany({
        columns: { id: true, number: true, notes: true, createdAt: true, updatedAt: true },
        with: {
          propertyResidents: {
            columns: { relationship: true },
            with: {
              resident: { columns: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            },
            // Soft-deleted residents keep their links (so undo restores them), but they're not shown.
            where: { resident: { deletedAt: { isNull: true } } },
          },
        },
        where: { deletedAt: { isNull: true } },
        orderBy: { updatedAt: 'desc' },
      }),
    )

    return houses.map((house) => ({
      id: house.id,
      number: house.number,
      notes: house.notes,
      created_at: house.createdAt.toISOString(),
      updated_at: house.updatedAt.toISOString(),
      property_residents: house.propertyResidents.flatMap((link) => {
        // Always there after the filter above; Drizzle types the join as optional anyway.
        if (!link.resident) {
          return []
        }
        const { resident } = link
        return [
          {
            relationship: link.relationship,
            resident: {
              id: resident.id,
              first_name: resident.firstName,
              last_name: resident.lastName,
              phone: resident.phone,
              email: resident.email,
            },
          },
        ]
      }),
    }))
  })

export const fetchHouses = () => fetchHousesFn()

/** Lightweight list for pickers: number + its owners (who the fee is billed to), "2" before "10". */
const fetchHousesPickerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const houses = await withCurrentUser((tx) =>
      tx.query.properties.findMany({
        columns: { id: true, number: true },
        with: {
          propertyResidents: {
            columns: {},
            with: { resident: { columns: { id: true, firstName: true, lastName: true } } },
            where: { relationship: 'owner', resident: { deletedAt: { isNull: true } } },
          },
        },
        where: { deletedAt: { isNull: true } },
      }),
    )

    return houses
      .map((house) => ({
        id: house.id,
        number: house.number,
        owners: house.propertyResidents.flatMap((link) => {
          if (!link.resident) {
            return []
          }
          const { resident } = link
          return [
            { resident: { id: resident.id, first_name: resident.firstName, last_name: resident.lastName } },
          ]
        }),
      }))
      .sort((a, b) => a.number.localeCompare(b.number, 'es', { numeric: true }))
  })

export const fetchHousesPicker = () => fetchHousesPickerFn()

const createHouseFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: CreateHouseInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { number, notes } = parsed.data

    let created: Array<{ id: string }>
    try {
      created = await withCurrentUser((tx) =>
        tx
          .insert(properties)
          .values({ number, notes: notes || null })
          .returning({ id: properties.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_create_house_failed()) }
    }

    return { data: created[0] }
  })

export const createHouse = (input: CreateHouseInput) => createHouseFn({ data: input })

const updateHouseFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: UpdateHouseInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { number, notes } = parsed.data

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(properties)
          .set({ number, notes: notes || null })
          .where(eq(properties.id, id))
          .returning({ id: properties.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_update_house_failed()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: updated[0] }
  })

export const updateHouse = (id: string, input: UpdateHouseInput) => updateHouseFn({ data: { id, input } })

/**
 * Soft-deletes one or more houses (sets deleted_at; a DB trigger stamps
 * deleted_by). Returns how many rows were affected: RLS doesn't raise on
 * UPDATE, it just filters rows out, so a short count means no permission.
 */
const deleteHousesFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.residential_select_house_required() }
    }

    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx
          .update(properties)
          .set({ deletedAt: sql`now()` })
          .where(and(inArray(properties.id, uniqueIds), isNull(properties.deletedAt)))
          .returning({ id: properties.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_delete_houses_failed()) }
    }

    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: { deleted: deleted.length } }
  })

export const deleteHouses = (ids: string[]) => deleteHousesFn({ data: ids })

/** Undoes a soft delete. Fails with 23505 if the number was reused meanwhile. */
const restoreHousesFn = createServerFn({ method: 'POST' })
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
          .update(properties)
          .set({ deletedAt: null })
          .where(and(inArray(properties.id, uniqueIds), isNotNull(properties.deletedAt)))
          .returning({ id: properties.id }),
      )
    } catch (error) {
      const message = toMessage(error, m.residential_restore_houses_failed())
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

export const restoreHouses = (ids: string[]) => restoreHousesFn({ data: ids })

/** Links residents to a house with one relationship for the whole batch. */
const assignResidentsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { houseId: string; input: AssignResidentsInput }) => data)
  .handler(async ({ data: { houseId, input } }): Promise<ActionResult<{ assigned: number }>> => {
    const parsed = assignResidentsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { relationship } = parsed.data
    const residentIds = [...new Set(parsed.data.residentIds)]

    let assigned: Array<{ residentId: string }>
    try {
      assigned = await withCurrentUser((tx) =>
        tx
          .insert(propertyResidents)
          .values(residentIds.map((residentId) => ({ propertyId: houseId, residentId, relationship })))
          .returning({ residentId: propertyResidents.residentId }),
      )
    } catch (error) {
      return {
        error: postgrestErrorMessage(databaseError(error), {
          fallback: m.residential_assign_residents_failed(),
          uniqueFallback: m.residential_resident_already_assigned(),
        }),
      }
    }

    return { data: { assigned: assigned.length } }
  })

export const assignResidents = (houseId: string, input: AssignResidentsInput) =>
  assignResidentsFn({ data: { houseId, input } })

/** Changes how a resident is linked to a house, for when it was recorded wrong. */
const updateRelationshipFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { houseId: string; residentId: string; input: UpdateRelationshipInput }) => data)
  .handler(async ({ data: { houseId, residentId, input } }): Promise<ActionResult<{ updated: number }>> => {
    const parsed = updateRelationshipSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    let updated: Array<{ residentId: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(propertyResidents)
          .set({ relationship: parsed.data.relationship })
          .where(and(eq(propertyResidents.propertyId, houseId), eq(propertyResidents.residentId, residentId)))
          .returning({ residentId: propertyResidents.residentId }),
      )
    } catch (error) {
      return {
        error: postgrestErrorMessage(databaseError(error), {
          fallback: m.residential_update_relationship_failed(),
        }),
      }
    }

    // RLS filters instead of raising on UPDATE, so 0 rows means no permission (or the link is gone).
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: { updated: updated.length } }
  })

export const updateRelationship = (houseId: string, residentId: string, input: UpdateRelationshipInput) =>
  updateRelationshipFn({ data: { houseId, residentId, input } })

/** Removes a resident from a house. The link is history, so this is only for mistakes. */
const unassignResidentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { houseId: string; residentId: string }) => data)
  .handler(async ({ data: { houseId, residentId } }): Promise<ActionResult<{ removed: number }>> => {
    let removed: Array<{ residentId: string }>
    try {
      removed = await withCurrentUser((tx) =>
        tx
          .delete(propertyResidents)
          .where(and(eq(propertyResidents.propertyId, houseId), eq(propertyResidents.residentId, residentId)))
          .returning({ residentId: propertyResidents.residentId }),
      )
    } catch (error) {
      return {
        error: postgrestErrorMessage(databaseError(error), {
          fallback: m.residential_unassign_resident_failed(),
        }),
      }
    }

    // RLS filters instead of raising on DELETE, so 0 rows means no permission (or already gone).
    if (removed.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: { removed: removed.length } }
  })

export const unassignResident = (houseId: string, residentId: string) =>
  unassignResidentFn({ data: { houseId, residentId } })

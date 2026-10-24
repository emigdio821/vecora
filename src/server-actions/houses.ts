import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { type ActionResult, errorMessage, isTaken } from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { db, transactionAs } from '@/lib/db'
import { properties, propertyResidents } from '@/lib/db/schema'
import { linkResidents } from '@/lib/services/registry'
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

const registryWrite = requirePermission({ registry: ['write'] })

function toMessage(error: unknown, fallback: string) {
  return errorMessage(error, {
    fallback,
    service: { not_found: m.residential_house_not_found() },
    constraints: { properties_number_unique: m.residential_house_number_taken() },
    uniqueFallback: m.residential_house_duplicate(),
  })
}

/** The houses and who lives in each, last changed first. */
const fetchHousesFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() =>
    db.query.properties.findMany({
      columns: { id: true, number: true, notes: true, createdAt: true, updatedAt: true },
      with: {
        residentLinks: {
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

export const fetchHouses = () => fetchHousesFn()

/** Lightweight list for pickers: number + its owners (who the fee is billed to), "2" before "10". */
const fetchHousesPickerFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(async () => {
    const houses = await db.query.properties.findMany({
      columns: { id: true, number: true },
      with: {
        residentLinks: {
          columns: {},
          with: { resident: { columns: { id: true, firstName: true, lastName: true } } },
          where: { relationship: 'owner', resident: { deletedAt: { isNull: true } } },
        },
      },
      where: { deletedAt: { isNull: true } },
    })

    return houses
      .map((house) => ({
        id: house.id,
        number: house.number,
        owners: house.residentLinks.map((link) => link.resident),
      }))
      .sort((a, b) => a.number.localeCompare(b.number, 'es', { numeric: true }))
  })

export const fetchHousesPicker = () => fetchHousesPickerFn()

const createHouseFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((input: CreateHouseInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { number, notes } = parsed.data

    try {
      const [created] = await transactionAs(context.user.id, (tx) =>
        tx
          .insert(properties)
          .values({ number, notes: notes || null })
          .returning({ id: properties.id }),
      )
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.residential_create_house_failed()) }
    }
  })

export const createHouse = (input: CreateHouseInput) => createHouseFn({ data: input })

const updateHouseFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((data: { id: string; input: UpdateHouseInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateHouseSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { number, notes } = parsed.data

    let updated: Array<{ id: string }>
    try {
      updated = await transactionAs(context.user.id, (tx) =>
        tx
          .update(properties)
          .set({ number, notes: notes || null })
          .where(and(eq(properties.id, id), isNull(properties.deletedAt)))
          .returning({ id: properties.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_update_house_failed()) }
    }
    if (updated.length === 0) {
      return { error: m.residential_house_not_found() }
    }

    return { data: updated[0] }
  })

export const updateHouse = (id: string, input: UpdateHouseInput) => updateHouseFn({ data: { id, input } })

/** Soft-deletes one or more houses. Returns how many were still there to delete. */
const deleteHousesFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids, context }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.residential_select_house_required() }
    }

    let deleted: Array<{ id: string }>
    try {
      deleted = await transactionAs(context.user.id, (tx) =>
        tx
          .update(properties)
          .set({ deletedAt: new Date(), deletedBy: context.user.id })
          .where(and(inArray(properties.id, uniqueIds), isNull(properties.deletedAt)))
          .returning({ id: properties.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_delete_houses_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.residential_house_not_found() }
    }

    return { data: { deleted: deleted.length } }
  })

export const deleteHouses = (ids: string[]) => deleteHousesFn({ data: ids })

/** Undoes a soft delete. Fails if the number was used again meanwhile. */
const restoreHousesFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids, context }): Promise<ActionResult<{ restored: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.common_nothing_to_restore() }
    }

    let restored: Array<{ id: string }>
    try {
      restored = await transactionAs(context.user.id, (tx) =>
        tx
          .update(properties)
          .set({ deletedAt: null, deletedBy: null })
          .where(and(inArray(properties.id, uniqueIds), isNotNull(properties.deletedAt)))
          .returning({ id: properties.id }),
      )
    } catch (error) {
      const message = toMessage(error, m.residential_restore_houses_failed())
      if (isTaken(error)) {
        return { error: m.residential_restore_failed_reason({ reason: message.toLowerCase() }) }
      }
      return { error: message }
    }
    if (restored.length === 0) {
      return { error: m.common_nothing_to_restore() }
    }

    return { data: { restored: restored.length } }
  })

export const restoreHouses = (ids: string[]) => restoreHousesFn({ data: ids })

/** Links residents to a house with one relationship for the whole batch. */
const assignResidentsFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((data: { houseId: string; input: AssignResidentsInput }) => data)
  .handler(async ({ data: { houseId, input }, context }): Promise<ActionResult<{ assigned: number }>> => {
    const parsed = assignResidentsSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { relationship } = parsed.data
    const residentIds = [...new Set(parsed.data.residentIds)]

    try {
      const assigned = await transactionAs(context.user.id, (tx) =>
        linkResidents(tx, { propertyId: houseId, residentIds, relationship }),
      )
      return { data: { assigned } }
    } catch (error) {
      return {
        error: errorMessage(error, {
          fallback: m.residential_assign_residents_failed(),
          service: { not_found: m.residential_house_not_found() },
          uniqueFallback: m.residential_resident_already_assigned(),
        }),
      }
    }
  })

export const assignResidents = (houseId: string, input: AssignResidentsInput) =>
  assignResidentsFn({ data: { houseId, input } })

/** Changes how a resident is linked to a house, for when it was recorded wrong. */
const updateRelationshipFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((data: { houseId: string; residentId: string; input: UpdateRelationshipInput }) => data)
  .handler(
    async ({ data: { houseId, residentId, input }, context }): Promise<ActionResult<{ updated: number }>> => {
      const parsed = updateRelationshipSchema.safeParse(input)
      if (!parsed.success) {
        return { error: m.common_form_invalid() }
      }

      let updated: Array<{ residentId: string }>
      try {
        updated = await transactionAs(context.user.id, (tx) =>
          tx
            .update(propertyResidents)
            .set({ relationship: parsed.data.relationship })
            .where(
              and(eq(propertyResidents.propertyId, houseId), eq(propertyResidents.residentId, residentId)),
            )
            .returning({ residentId: propertyResidents.residentId }),
        )
      } catch (error) {
        return { error: errorMessage(error, { fallback: m.residential_update_relationship_failed() }) }
      }
      // The link was removed meanwhile.
      if (updated.length === 0) {
        return { error: m.residential_update_relationship_failed() }
      }

      return { data: { updated: updated.length } }
    },
  )

export const updateRelationship = (houseId: string, residentId: string, input: UpdateRelationshipInput) =>
  updateRelationshipFn({ data: { houseId, residentId, input } })

/** Removes a resident from a house. The link is history, so this is only for mistakes. */
const unassignResidentFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((data: { houseId: string; residentId: string }) => data)
  .handler(async ({ data: { houseId, residentId }, context }): Promise<ActionResult<{ removed: number }>> => {
    let removed: Array<{ residentId: string }>
    try {
      removed = await transactionAs(context.user.id, (tx) =>
        tx
          .delete(propertyResidents)
          .where(and(eq(propertyResidents.propertyId, houseId), eq(propertyResidents.residentId, residentId)))
          .returning({ residentId: propertyResidents.residentId }),
      )
    } catch (error) {
      return { error: errorMessage(error, { fallback: m.residential_unassign_resident_failed() }) }
    }
    // Already removed: what was asked for is done.
    return { data: { removed: removed.length } }
  })

export const unassignResident = (houseId: string, residentId: string) =>
  unassignResidentFn({ data: { houseId, residentId } })

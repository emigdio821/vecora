import { createServerFn } from '@tanstack/react-start'
import { and, inArray, isNotNull, isNull } from 'drizzle-orm'
import { type ActionResult, errorMessage, isTaken } from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { parseRoles } from '@/lib/auth/roles'
import { db, transactionAs } from '@/lib/db'
import { residents } from '@/lib/db/schema'
import * as registry from '@/lib/services/registry'
import {
  type CreateResidentInput,
  createResidentSchema,
  type UpdateResidentInput,
  updateResidentSchema,
} from '@/lib/validations/residents'
import { m } from '@/paraglide/messages'

const registryWrite = requirePermission({ registry: ['write'] })

function toMessage(error: unknown, fallback: string) {
  return errorMessage(error, {
    fallback,
    service: {
      email_taken: m.residential_resident_email_account(),
      not_found: m.residential_selected_house_missing(),
    },
    constraints: { residents_email_unique: m.residential_resident_email_taken() },
    uniqueFallback: m.residential_resident_duplicate(),
  })
}

/** The residents, their board account if any, and their houses, last changed first. */
const fetchResidentsFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(async () => {
    const list = await db.query.residents.findMany({
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
        user: { columns: { id: true, name: true, role: true } },
        propertyLinks: {
          columns: { relationship: true },
          with: { property: { columns: { id: true, number: true } } },
          // Soft-deleted houses keep their links (so undo restores them), but they're not shown.
          where: { property: { deletedAt: { isNull: true } } },
        },
      },
      where: { deletedAt: { isNull: true } },
      orderBy: { updatedAt: 'desc' },
    })

    return list.map(({ user, ...resident }) => {
      let account: { id: string; name: string; roles: ReturnType<typeof parseRoles> } | null = null
      if (user) {
        // No roles: once on the board, since taken off it.
        account = { id: user.id, name: user.name, roles: parseRoles(user.role) }
      }
      return { ...resident, account }
    })
  })

export const fetchResidents = () => fetchResidentsFn()

/**
 * Lightweight list for pickers: identity + which houses each resident is
 * linked to. `email` is there for the board picker (an account needs one).
 */
const fetchResidentsPickerFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() =>
    db.query.residents.findMany({
      columns: { id: true, firstName: true, lastName: true, email: true },
      with: {
        propertyLinks: {
          columns: {},
          with: { property: { columns: { id: true, number: true } } },
          where: { property: { deletedAt: { isNull: true } } },
        },
      },
      where: { deletedAt: { isNull: true } },
      orderBy: { firstName: 'asc', lastName: 'asc' },
    }),
  )

export const fetchResidentsPicker = () => fetchResidentsPickerFn()

const createResidentFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((input: CreateResidentInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createResidentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { firstName, lastName, phone, email, notes, propertyId, relationship } = parsed.data

    let house: { propertyId: string; relationship: typeof relationship } | null = null
    if (propertyId) {
      house = { propertyId, relationship }
    }

    try {
      const created = await transactionAs(context.user.id, (tx) =>
        registry.createResident(tx, {
          firstName,
          lastName,
          phone,
          email: email || null,
          notes: notes || null,
          house,
        }),
      )
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.residential_create_resident_failed()) }
    }
  })

export const createResident = (input: CreateResidentInput) => createResidentFn({ data: input })

const updateResidentFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((data: { id: string; input: UpdateResidentInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateResidentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { firstName, lastName, phone, email, notes } = parsed.data

    let updated: { id: string } | null
    try {
      updated = await transactionAs(context.user.id, (tx) =>
        registry.updateResident(tx, id, {
          firstName,
          lastName,
          phone,
          email: email || null,
          notes: notes || null,
        }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_update_resident_failed()) }
    }
    if (!updated) {
      return { error: m.residential_resident_not_found() }
    }

    return { data: updated }
  })

export const updateResident = (id: string, input: UpdateResidentInput) =>
  updateResidentFn({ data: { id, input } })

/** Soft-deletes one or more residents. Returns how many were still there to delete. */
const deleteResidentsFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids, context }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.residential_select_resident_required() }
    }

    let deleted: Array<{ id: string }>
    try {
      deleted = await transactionAs(context.user.id, (tx) =>
        tx
          .update(residents)
          .set({ deletedAt: new Date(), deletedBy: context.user.id })
          .where(and(inArray(residents.id, uniqueIds), isNull(residents.deletedAt)))
          .returning({ id: residents.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_delete_residents_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.residential_resident_not_found() }
    }

    return { data: { deleted: deleted.length } }
  })

export const deleteResidents = (ids: string[]) => deleteResidentsFn({ data: ids })

/** Undoes a soft delete. Fails if the email was used again meanwhile. */
const restoreResidentsFn = createServerFn({ method: 'POST' })
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
          .update(residents)
          .set({ deletedAt: null, deletedBy: null })
          .where(and(inArray(residents.id, uniqueIds), isNotNull(residents.deletedAt)))
          .returning({ id: residents.id }),
      )
    } catch (error) {
      const message = toMessage(error, m.residential_restore_residents_failed())
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

export const restoreResidents = (ids: string[]) => restoreResidentsFn({ data: ids })

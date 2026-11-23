import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { type ActionResult, errorMessage, isTaken } from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { db, transactionAs } from '@/lib/db'
import { vehicles } from '@/lib/db/schema'
import {
  assignVehicles as assignVehiclesService,
  createVehicle,
  updateVehicle as updateVehicleService,
} from '@/lib/services/registry'
import {
  type AssignVehiclesInput,
  assignVehiclesSchema,
  type VehicleInput,
  vehicleSchema,
} from '@/lib/validations/vehicles'
import { m } from '@/paraglide/messages'

// The Vehicles tab, and a house's vehicles (also listed with the houses, in
// fetchHouses). Same permission as the houses.

const registryWrite = requirePermission({ registry: ['write'] })

function toMessage(error: unknown, fallback: string) {
  return errorMessage(error, {
    fallback,
    service: { not_found: m.residential_selected_house_missing() },
    constraints: {
      vehicles_plate_unique: m.residential_plate_taken(),
      vehicles_rfid_serial_unique: m.residential_rfid_taken(),
    },
  })
}

/** Every live vehicle with its house, last changed first. */
const fetchVehiclesFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() =>
    db.query.vehicles.findMany({
      columns: { id: true, kind: true, plate: true, rfidSerial: true, createdAt: true, updatedAt: true },
      with: { property: { columns: { id: true, number: true } } },
      where: { deletedAt: { isNull: true } },
      orderBy: { updatedAt: 'desc' },
    }),
  )

export const fetchVehicles = () => fetchVehiclesFn()

const addVehicleFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((input: VehicleInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = vehicleSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, plate, rfidSerial, propertyId } = parsed.data

    try {
      const created = await transactionAs(context.user.id, (tx) =>
        createVehicle(tx, { kind, plate, rfidSerial: rfidSerial || null, propertyId }),
      )
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.residential_add_vehicle_failed()) }
    }
  })

export const addVehicle = (input: VehicleInput) => addVehicleFn({ data: input })

const updateVehicleFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((data: { id: string; input: VehicleInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = vehicleSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, plate, rfidSerial, propertyId } = parsed.data

    let updated: { id: string } | null
    try {
      updated = await transactionAs(context.user.id, (tx) =>
        updateVehicleService(tx, id, { kind, plate, rfidSerial: rfidSerial || null, propertyId }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_update_vehicle_failed()) }
    }
    if (updated === null) {
      return { error: m.residential_vehicle_not_found() }
    }

    return { data: updated }
  })

export const updateVehicle = (id: string, input: VehicleInput) => updateVehicleFn({ data: { id, input } })

/** Assigns existing vehicles to a house; one on another house moves here. */
const assignVehiclesFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((data: { houseId: string; input: AssignVehiclesInput }) => data)
  .handler(async ({ data: { houseId, input }, context }): Promise<ActionResult<{ assigned: number }>> => {
    const parsed = assignVehiclesSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const vehicleIds = [...new Set(parsed.data.vehicleIds)]

    let assigned: number
    try {
      assigned = await transactionAs(context.user.id, (tx) =>
        assignVehiclesService(tx, { propertyId: houseId, vehicleIds }),
      )
    } catch (error) {
      return {
        error: errorMessage(error, {
          fallback: m.residential_assign_vehicles_failed(),
          service: { not_found: m.residential_house_not_found() },
        }),
      }
    }
    // All of them deleted meanwhile.
    if (assigned === 0) {
      return { error: m.residential_vehicle_not_found() }
    }

    return { data: { assigned } }
  })

export const assignVehicles = (houseId: string, input: AssignVehiclesInput) =>
  assignVehiclesFn({ data: { houseId, input } })

/** Takes a vehicle off its house; it stays in the Vehicles tab, without one. */
const unassignVehicleFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult<{ unassigned: number }>> => {
    let unassigned: Array<{ id: string }>
    try {
      unassigned = await transactionAs(context.user.id, (tx) =>
        tx
          .update(vehicles)
          .set({ propertyId: null })
          .where(and(eq(vehicles.id, id), isNotNull(vehicles.propertyId)))
          .returning({ id: vehicles.id }),
      )
    } catch (error) {
      return { error: errorMessage(error, { fallback: m.residential_remove_vehicle_failed() }) }
    }
    // Already without a house: what was asked for is done.
    return { data: { unassigned: unassigned.length } }
  })

export const unassignVehicle = (id: string) => unassignVehicleFn({ data: id })

/** Soft-deletes one or more vehicles. Returns how many were still there to delete. */
const deleteVehiclesFn = createServerFn({ method: 'POST' })
  .middleware([registryWrite])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids, context }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.residential_select_vehicle_required() }
    }

    let deleted: Array<{ id: string }>
    try {
      deleted = await transactionAs(context.user.id, (tx) =>
        tx
          .update(vehicles)
          .set({ deletedAt: new Date(), deletedBy: context.user.id })
          .where(and(inArray(vehicles.id, uniqueIds), isNull(vehicles.deletedAt)))
          .returning({ id: vehicles.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.residential_delete_vehicles_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.residential_vehicle_not_found() }
    }

    return { data: { deleted: deleted.length } }
  })

export const deleteVehicles = (ids: string[]) => deleteVehiclesFn({ data: ids })

/**
 * Undoes a soft delete, with the house it had (a deleted house unassigns
 * even its deleted vehicles). Fails if the plate or tag was used again meanwhile.
 */
const restoreVehiclesFn = createServerFn({ method: 'POST' })
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
          .update(vehicles)
          .set({ deletedAt: null, deletedBy: null })
          .where(and(inArray(vehicles.id, uniqueIds), isNotNull(vehicles.deletedAt)))
          .returning({ id: vehicles.id }),
      )
    } catch (error) {
      const message = toMessage(error, m.residential_restore_vehicles_failed())
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

export const restoreVehicles = (ids: string[]) => restoreVehiclesFn({ data: ids })

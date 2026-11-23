import { z } from 'zod'
import { VEHICLE_KINDS } from '@/lib/enums'
import { m } from '@/paraglide/messages'

export const vehicleSchema = z.object({
  kind: z.enum(VEHICLE_KINDS, { error: () => m.residential_vehicle_kind_required() }),
  // Unique in the DB among live vehicles, ignoring case, spaces and dashes.
  plate: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, { error: () => m.residential_plate_required() }),
  // Optional: empty means the vehicle has no tag yet. Unique in the DB among live vehicles, ignoring case.
  rfidSerial: z.string().trim(),
  // Optional: a vehicle can be registered before it's assigned to a house.
  propertyId: z.uuid().nullable(),
})

export type VehicleInput = z.infer<typeof vehicleSchema>

/** Assigns existing vehicles to a house, from the house's side. */
export const assignVehiclesSchema = z.object({
  vehicleIds: z.array(z.uuid()).min(1, { error: () => m.residential_select_vehicle_required() }),
})

export type AssignVehiclesInput = z.infer<typeof assignVehiclesSchema>

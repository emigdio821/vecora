// The registry's rules that the tables can't hold on their own:
//
//   * A resident's email is unique among live residents (an index), and also
//     can't be another account's sign-in email: it becomes theirs if they
//     join the board.
//   * A board member's account is named after their resident record, so a
//     rename in the registry shows in the board, the sidebar and the log.
//     The main admin keeps its own name.
//   * A resident is linked to a live house only (the foreign key accepts a
//     deleted one, which would be invisible). The same goes for a vehicle.
import { and, eq, inArray, isNull, ne } from 'drizzle-orm'
import type { Transaction } from '@/lib/db/client'
import { properties, propertyResidents, residents, users, vehicles } from '@/lib/db/schema'
import { isEmailTaken } from './board'
import { ServiceError } from './errors'

type Relationship = (typeof propertyResidents.$inferInsert)['relationship']

export interface ResidentFields {
  firstName: string
  lastName: string
  phone: string
  email: string | null
  notes: string | null
}

async function requireLiveHouse(tx: Transaction, propertyId: string): Promise<void> {
  const [house] = await tx
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), isNull(properties.deletedAt)))
    .limit(1)
  if (!house) {
    throw new ServiceError('not_found', `house ${propertyId}`)
  }
}

/**
 * Creates a resident, linked to a house when one is given. `userId` (an
 * account to link, for the seed) may share the email.
 */
export async function createResident(
  tx: Transaction,
  input: ResidentFields & {
    id?: string
    userId?: string
    house: { propertyId: string; relationship: Relationship } | null
  },
): Promise<{ id: string }> {
  if (input.email !== null && (await isEmailTaken(tx, input.email, input.userId ?? null))) {
    throw new ServiceError('email_taken')
  }
  if (input.house) {
    await requireLiveHouse(tx, input.house.propertyId)
  }

  const [created] = await tx
    .insert(residents)
    .values({
      id: input.id,
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
    })
    .returning({ id: residents.id })

  if (input.house) {
    await tx.insert(propertyResidents).values({
      propertyId: input.house.propertyId,
      residentId: created.id,
      relationship: input.house.relationship,
    })
  }

  return created
}

/** Edits a resident; a board member's account takes the new name. Null when the resident is gone. */
export async function updateResident(
  tx: Transaction,
  id: string,
  input: ResidentFields,
): Promise<{ id: string } | null> {
  const resident = await tx.query.residents.findFirst({
    columns: { userId: true },
    where: { id, deletedAt: { isNull: true } },
  })
  if (!resident) {
    return null
  }
  if (input.email !== null && (await isEmailTaken(tx, input.email, resident.userId))) {
    throw new ServiceError('email_taken')
  }

  await tx
    .update(residents)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      notes: input.notes,
    })
    .where(eq(residents.id, id))

  if (resident.userId !== null) {
    const name = `${input.firstName} ${input.lastName}`
    await tx
      .update(users)
      .set({ name })
      .where(and(eq(users.id, resident.userId), eq(users.isMainAdmin, false), ne(users.name, name)))
  }

  return { id }
}

/** Links a resident to a live house. */
export async function linkResidents(
  tx: Transaction,
  input: { propertyId: string; residentIds: string[]; relationship: Relationship },
): Promise<number> {
  await requireLiveHouse(tx, input.propertyId)
  const linked = await tx
    .insert(propertyResidents)
    .values(
      input.residentIds.map((residentId) => ({
        propertyId: input.propertyId,
        residentId,
        relationship: input.relationship,
      })),
    )
    .returning({ residentId: propertyResidents.residentId })
  return linked.length
}

type VehicleFields = Pick<typeof vehicles.$inferInsert, 'kind' | 'plate' | 'rfidSerial'> & {
  /** None: the vehicle isn't assigned to a house (yet). */
  propertyId: string | null
}

/** Registers a vehicle, assigned to a live house when one is given. */
export async function createVehicle(tx: Transaction, input: VehicleFields): Promise<{ id: string }> {
  if (input.propertyId !== null) {
    await requireLiveHouse(tx, input.propertyId)
  }
  const [created] = await tx
    .insert(vehicles)
    .values({
      propertyId: input.propertyId,
      kind: input.kind,
      plate: input.plate,
      rfidSerial: input.rfidSerial,
    })
    .returning({ id: vehicles.id })
  return created
}

/**
 * Assigns live vehicles to a live house. A vehicle has one house, so one
 * on another house moves here. Returns how many were still there to assign.
 */
export async function assignVehicles(
  tx: Transaction,
  input: { propertyId: string; vehicleIds: string[] },
): Promise<number> {
  await requireLiveHouse(tx, input.propertyId)
  const assigned = await tx
    .update(vehicles)
    .set({ propertyId: input.propertyId })
    .where(and(inArray(vehicles.id, input.vehicleIds), isNull(vehicles.deletedAt)))
    .returning({ id: vehicles.id })
  return assigned.length
}

/** Edits a live vehicle, its house included. Null when the vehicle is gone. */
export async function updateVehicle(
  tx: Transaction,
  id: string,
  input: VehicleFields,
): Promise<{ id: string } | null> {
  if (input.propertyId !== null) {
    await requireLiveHouse(tx, input.propertyId)
  }
  const [updated] = await tx
    .update(vehicles)
    .set({
      propertyId: input.propertyId,
      kind: input.kind,
      plate: input.plate,
      rfidSerial: input.rfidSerial,
    })
    .where(and(eq(vehicles.id, id), isNull(vehicles.deletedAt)))
    .returning({ id: vehicles.id })
  if (!updated) {
    return null
  }
  return updated
}

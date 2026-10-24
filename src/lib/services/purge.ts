// The nightly purge: houses and residents deleted more than 6 months ago are
// removed for good, if nothing refers to them. One that appears in any
// history (a house link, the ledger, a booking) is kept forever, hidden, so
// "who owned 2B in 2024?" stays answerable. A new history table needs its own
// `not exists` here; its foreign key restricts deletes as a second line of
// defense, so a missing check fails the purge instead of losing history.
//
// Runs with no actor: the activity log shows its deletes as the system's.
import { and, eq, lt, notExists, sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { amenityReservations, properties, propertyResidents, residents, transactions } from '@/lib/db/schema'

const SIX_MONTHS_AGO = sql`now() - interval '6 months'`

export async function purgeSoftDeleted(db: Database): Promise<{ residents: number; houses: number }> {
  return db.transaction(async (tx) => {
    const purgedResidents = await tx
      .delete(residents)
      .where(
        and(
          lt(residents.deletedAt, SIX_MONTHS_AGO),
          notExists(
            tx
              .select({ id: propertyResidents.residentId })
              .from(propertyResidents)
              .where(eq(propertyResidents.residentId, residents.id)),
          ),
        ),
      )
      .returning({ id: residents.id })

    const purgedHouses = await tx
      .delete(properties)
      .where(
        and(
          lt(properties.deletedAt, SIX_MONTHS_AGO),
          notExists(
            tx
              .select({ id: propertyResidents.propertyId })
              .from(propertyResidents)
              .where(eq(propertyResidents.propertyId, properties.id)),
          ),
          notExists(
            tx
              .select({ id: transactions.id })
              .from(transactions)
              .where(eq(transactions.propertyId, properties.id)),
          ),
          notExists(
            tx
              .select({ id: amenityReservations.id })
              .from(amenityReservations)
              .where(eq(amenityReservations.propertyId, properties.id)),
          ),
        ),
      )
      .returning({ id: properties.id })

    return { residents: purgedResidents.length, houses: purgedHouses.length }
  })
}

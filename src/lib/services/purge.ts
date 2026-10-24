// The nightly purge: houses and residents deleted more than 6 months ago are
// removed for good, if nothing refers to them. One that appears in any
// history (a house link, the ledger, a booking) is kept forever, hidden, so
// "who owned 2B in 2024?" stays answerable. A new history table needs its own
// `not exists` here; its foreign key restricts deletes as a second line of
// defense, so a missing check fails the purge instead of losing history.
//
// Runs with no actor: the activity log shows its deletes as the system's.
import { sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'

export async function purgeSoftDeleted(db: Database): Promise<{ residents: number; houses: number }> {
  return db.transaction(async (tx) => {
    const residents = await tx.execute<{ id: string }>(sql`
      delete from residents r
      where r.deleted_at < now() - interval '6 months'
        and not exists (select 1 from property_residents pr where pr.resident_id = r.id)
      returning r.id
    `)

    const houses = await tx.execute<{ id: string }>(sql`
      delete from properties p
      where p.deleted_at < now() - interval '6 months'
        and not exists (select 1 from property_residents pr where pr.property_id = p.id)
        and not exists (select 1 from transactions t where t.property_id = p.id)
        and not exists (select 1 from amenity_reservations ar where ar.property_id = p.id)
      returning p.id
    `)

    return { residents: residents.rows.length, houses: houses.rows.length }
  })
}

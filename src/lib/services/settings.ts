// The HOA's single settings row.
//
//   * The president edits the name and the logo (settings.write); the
//     language and the currency shape every record from then on, so they are
//     an admin's (settings.configure).
//   * currency applies to new amounts only: every money row is written with
//     the currency of the HOA at that moment (or of the row it comes from)
//     and keeps it.
import { eq } from 'drizzle-orm'
import type { Transaction } from '@/lib/db/client'
import { settings } from '@/lib/db/schema'

type Currency = (typeof settings.$inferSelect)['currency']

/** The currency new amounts are recorded in. */
export async function hoaCurrency(tx: Transaction): Promise<Currency> {
  const [row] = await tx.select({ currency: settings.currency }).from(settings).limit(1)
  return row.currency
}

export interface SettingsChange {
  residentialName?: string
  defaultLanguage?: (typeof settings.$inferSelect)['defaultLanguage']
  currency?: Currency
  logoPath?: string | null
}

/** Writes the given fields of the settings row. Who may change which is the server function's check. */
export async function updateSettings(tx: Transaction, change: SettingsChange): Promise<void> {
  const [row] = await tx.select({ id: settings.id }).from(settings).limit(1)
  await tx.update(settings).set(change).where(eq(settings.id, row.id))
}

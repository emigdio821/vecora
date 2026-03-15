import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { owners } from '..'
import type { SelectHouse } from './houses'
import type { SelectPayment } from './payments'
import type { SelectProfile } from './profiles'
import type { SelectUser } from './users'
import type { SelectViolation } from './violations'

export const insertOwnerSchema = createInsertSchema(owners)
export const selectOwnerSchema = createSelectSchema(owners)

export type InsertOwner = z.infer<typeof insertOwnerSchema>
export type SelectOwner = z.infer<typeof selectOwnerSchema>

// Type for owners with all relations included
export type OwnerWithRelations = SelectOwner & {
  houses: SelectHouse[]
  violations: SelectViolation[]
  payments: SelectPayment[]
  profile:
    | (SelectProfile & {
        user: SelectUser
      })
    | null
}

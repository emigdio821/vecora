import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { houses } from '../main'
import type { SelectOwner } from './owners'

export const insertHouseSchema = createInsertSchema(houses)
export const selectHouseSchema = createSelectSchema(houses)

export type InsertHouse = z.infer<typeof insertHouseSchema>
export type SelectHouse = z.infer<typeof selectHouseSchema>

// Type for houses with owner relation included
export type HouseWithOwner = SelectHouse & {
  owner: SelectOwner | null
}

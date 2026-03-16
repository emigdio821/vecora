import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { houses } from '..'

export const insertHouseSchema = createInsertSchema(houses)
export const selectHouseSchema = createSelectSchema(houses)

export type InsertHouse = z.infer<typeof insertHouseSchema>
export type SelectHouse = z.infer<typeof selectHouseSchema>

import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { residents } from '..'

export const insertResidentSchema = createInsertSchema(residents)
export const selectResidentSchema = createSelectSchema(residents)

export type InsertResident = z.infer<typeof insertResidentSchema>
export type SelectResident = z.infer<typeof selectResidentSchema>

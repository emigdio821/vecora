import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { hoaBoard, hoaBoardPeriods } from '..'

export const insertHoaBoardPeriodSchema = createInsertSchema(hoaBoardPeriods)
export const selectHoaBoardPeriodSchema = createSelectSchema(hoaBoardPeriods)

export const insertHoaBoardSchema = createInsertSchema(hoaBoard)
export const selectHoaBoardSchema = createSelectSchema(hoaBoard)

export type InsertHoaBoardPeriod = z.infer<typeof insertHoaBoardPeriodSchema>
export type SelectHoaBoardPeriod = z.infer<typeof selectHoaBoardPeriodSchema>

export type InsertHoaBoard = z.infer<typeof insertHoaBoardSchema>
export type SelectHoaBoard = z.infer<typeof selectHoaBoardSchema>

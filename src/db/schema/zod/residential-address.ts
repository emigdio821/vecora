import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { residentialAddress } from '..'

export const insertResidentialAddressSchema = createInsertSchema(residentialAddress)
export const selectResidentialAddressSchema = createSelectSchema(residentialAddress)

export type InsertResidentialAddress = z.infer<typeof insertResidentialAddressSchema>
export type SelectResidentialAddress = z.infer<typeof selectResidentialAddressSchema>

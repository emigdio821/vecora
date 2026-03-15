import { createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { user } from '../auth'

export const selectUserSchema = createSelectSchema(user)

export type SelectUser = z.infer<typeof selectUserSchema>

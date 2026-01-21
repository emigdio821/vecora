import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { violations } from '@/db/schemas/main'
import type { InsertViolation, SelectViolation, ViolationWithOwner } from '@/db/schemas/zod'
import { authMiddleware } from '@/middleware/auth'
import { createViolationSchema, deleteViolationSchema, updateViolationSchema } from '@/schemas/violations'

export const createViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createViolationSchema)
  .handler(async ({ data }) => {
    const [newViolation] = await db.insert(violations).values(data).returning()

    return newViolation satisfies InsertViolation
  })

export const updateViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateViolationSchema)
  .handler(async ({ data }) => {
    const { violationId, ...updateData } = data
    const [updatedViolation] = await db
      .update(violations)
      .set(updateData)
      .where(eq(violations.id, violationId))
      .returning()

    return updatedViolation satisfies SelectViolation
  })

export const deleteViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteViolationSchema)
  .handler(async ({ data }) => {
    const { violationId } = data
    const [deletedViolation] = await db.delete(violations).where(eq(violations.id, violationId)).returning()

    return deletedViolation satisfies SelectViolation
  })

export const getViolationsList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const allViolations = await db.query.violations.findMany({
      with: {
        owner: true,
      },
      orderBy: (violations, { desc }) => [desc(violations.violationDate)],
    })

    return allViolations satisfies ViolationWithOwner[]
  })

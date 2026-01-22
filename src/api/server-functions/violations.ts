import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit'
import { db } from '@/db'
import { violations } from '@/db/schemas/main'
import type { InsertViolation, SelectViolation, ViolationWithOwner } from '@/db/schemas/zod/violations'
import { authMiddleware } from '@/middleware/auth'
import { createViolationSchema, deleteViolationSchema, updateViolationSchema } from '@/schemas/violations'

export const createViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createViolationSchema)
  .handler(async ({ data }) => {
    const [newViolation] = await db.insert(violations).values(data).returning()

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'violation',
        entityId: newViolation.id,
        newData: newViolation,
      },
    }).catch(console.error)

    return newViolation satisfies InsertViolation
  })

export const updateViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateViolationSchema)
  .handler(async ({ data }) => {
    const { violationId, ...updateData } = data

    const [oldViolation] = await db.select().from(violations).where(eq(violations.id, violationId)).limit(1)

    const [updatedViolation] = await db
      .update(violations)
      .set(updateData)
      .where(eq(violations.id, violationId))
      .returning()

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'violation',
        entityId: updatedViolation.id,
        oldData: oldViolation,
        newData: updatedViolation,
      },
    }).catch(console.error)

    return updatedViolation satisfies SelectViolation
  })

export const deleteViolation = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteViolationSchema)
  .handler(async ({ data }) => {
    const { violationId } = data

    const [violationToDelete] = await db
      .select()
      .from(violations)
      .where(eq(violations.id, violationId))
      .limit(1)

    const [deletedViolation] = await db.delete(violations).where(eq(violations.id, violationId)).returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'violation',
        entityId: deletedViolation.id,
        oldData: violationToDelete,
      },
    }).catch(console.error)

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

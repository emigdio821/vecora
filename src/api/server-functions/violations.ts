import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { violations } from '@/db/schema'
import type { SelectResident } from '@/db/schema/zod/residents'
import type { SelectViolation } from '@/db/schema/zod/violations'
import { authMiddleware } from '@/middleware/auth'
import { createViolationSchema, deleteViolationSchema, updateViolationSchema } from '@/schemas/violations'

export type ViolationQueryData = SelectViolation & {
  resident: SelectResident | null
}

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

    return newViolation
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

    return updatedViolation
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

    return deletedViolation
  })

export const getViolationsList = createServerFn()
  .middleware([authMiddleware])
  .handler(async (): Promise<ViolationQueryData[]> => {
    const allViolations = await db.query.violations.findMany({
      with: {
        resident: true,
      },
      orderBy: (violations, { desc }) => [desc(violations.violationDate)],
    })

    return allViolations
  })

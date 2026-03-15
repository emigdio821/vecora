import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { houses, owners } from '@/db/schema'
import type { OwnerWithRelations, SelectOwner } from '@/db/schema/zod/owners'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { createOwnerSchema, deleteOwnerSchema, updateOwnerSchema } from '@/schemas/owners'

export const getOwners = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const ownersData = await db.query.owners.findMany({
      with: {
        houses: true,
        violations: true,
        payments: true,
        profile: {
          with: {
            user: true,
          },
        },
      },
      orderBy: (owner, { desc }) => [desc(owner.updatedAt)],
    })

    return ownersData satisfies OwnerWithRelations[]
  })

export const createOwner = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createOwnerSchema)
  .handler(async ({ data }) => {
    const [newOwner] = await db
      .insert(owners)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
      })
      .returning()

    if (data.houseIds.length > 0) {
      for (const houseId of data.houseIds) {
        await db.update(houses).set({ ownerId: newOwner.id }).where(eq(houses.id, houseId))
      }
    }

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'owner',
        entityId: newOwner.id,
        newData: newOwner,
      },
    }).catch(console.error)

    return newOwner satisfies SelectOwner
  })

export const updateOwner = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(updateOwnerSchema)
  .handler(async ({ data }) => {
    const [oldOwner] = await db.select().from(owners).where(eq(owners.id, data.ownerId)).limit(1)

    const [updatedOwner] = await db
      .update(owners)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        updatedAt: new Date(),
      })
      .where(eq(owners.id, data.ownerId))
      .returning()

    await db.update(houses).set({ ownerId: null }).where(eq(houses.ownerId, data.ownerId))

    if (data.houseIds.length > 0) {
      for (const houseId of data.houseIds) {
        await db.update(houses).set({ ownerId: updatedOwner.id }).where(eq(houses.id, houseId))
      }
    }

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'owner',
        entityId: updatedOwner.id,
        oldData: oldOwner,
        newData: updatedOwner,
      },
    }).catch(console.error)

    return updatedOwner satisfies SelectOwner
  })

export const deleteOwner = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(deleteOwnerSchema)
  .handler(async ({ data }) => {
    const [ownerToDelete] = await db.select().from(owners).where(eq(owners.id, data.ownerId)).limit(1)

    await db.update(houses).set({ ownerId: null }).where(eq(houses.ownerId, data.ownerId))

    const [deletedOwner] = await db.delete(owners).where(eq(owners.id, data.ownerId)).returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'owner',
        entityId: deletedOwner.id,
        oldData: ownerToDelete,
      },
    }).catch(console.error)

    return deletedOwner satisfies SelectOwner
  })

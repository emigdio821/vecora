import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { houses, owners } from '@/db/schemas/main'
import type { OwnerWithRelations, SelectOwner } from '@/db/schemas/zod'
import { adminOnlyAPIMiddleware } from '@/middleware/admin'
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
  .middleware([adminOnlyAPIMiddleware])
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

    if (data.houseId) {
      await db.update(houses).set({ ownerId: newOwner.id }).where(eq(houses.id, data.houseId))
    }

    return newOwner satisfies SelectOwner
  })

export const updateOwner = createServerFn({ method: 'POST' })
  .middleware([adminOnlyAPIMiddleware])
  .inputValidator(updateOwnerSchema)
  .handler(async ({ data }) => {
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

    return updatedOwner satisfies SelectOwner
  })

export const deleteOwner = createServerFn({ method: 'POST' })
  .middleware([adminOnlyAPIMiddleware])
  .inputValidator(deleteOwnerSchema)
  .handler(async ({ data }) => {
    await db.update(houses).set({ ownerId: null }).where(eq(houses.ownerId, data.ownerId))

    const [deletedOwner] = await db.delete(owners).where(eq(owners.id, data.ownerId)).returning()

    return deletedOwner satisfies SelectOwner
  })

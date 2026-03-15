import { createServerFn } from '@tanstack/react-start'
import { eq, isNull } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { houses } from '@/db/schema'
import type { HouseWithOwner, InsertHouse, SelectHouse } from '@/db/schema/zod/houses'
import { authMiddleware } from '@/middleware/auth'
import { createHouseSchema, deleteHouseSchema, updateHouseSchema } from '@/schemas/houses'

export const createHouse = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createHouseSchema)
  .handler(async ({ data }) => {
    const [newHouse] = await db.insert(houses).values(data).returning()

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'house',
        entityId: newHouse.id,
        newData: newHouse,
      },
    }).catch(console.error)

    return newHouse satisfies InsertHouse
  })

export const updateHouse = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateHouseSchema)
  .handler(async ({ data }) => {
    const { houseId, ...updateData } = data

    const [oldHouse] = await db.select().from(houses).where(eq(houses.id, houseId)).limit(1)

    const [updatedHouse] = await db.update(houses).set(updateData).where(eq(houses.id, houseId)).returning()

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'house',
        entityId: updatedHouse.id,
        oldData: oldHouse,
        newData: updatedHouse,
      },
    }).catch(console.error)

    return updatedHouse satisfies SelectHouse
  })

export const getHouses = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const allHouses = await db.query.houses.findMany({
      with: {
        owner: true,
      },
      orderBy: (houses, { desc }) => [desc(houses.updatedAt)],
    })

    return allHouses satisfies HouseWithOwner[]
  })

export const deleteHouse = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteHouseSchema)
  .handler(async ({ data }) => {
    const [houseToDelete] = await db.select().from(houses).where(eq(houses.id, data.houseId)).limit(1)
    const [deletdHouse] = await db.delete(houses).where(eq(houses.id, data.houseId)).returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'house',
        entityId: deletdHouse.id,
        oldData: houseToDelete,
      },
    }).catch(console.error)

    return houseToDelete satisfies SelectHouse
  })

export const getAvailableHouses = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const availableHouses = await db.query.houses.findMany({
      where: isNull(houses.ownerId),
      orderBy: (houses, { asc }) => [asc(houses.houseNumber)],
    })

    return availableHouses satisfies SelectHouse[]
  })

import { createServerFn } from '@tanstack/react-start'
import { eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { houses } from '@/db/schemas/main'
import type { HouseWithOwner, InsertHouse, SelectHouse } from '@/db/schemas/zod/houses'
import { authMiddleware } from '@/middleware/auth'
import { createHouseSchema, updateHouseSchema } from '@/schemas/houses'

export const createHouse = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createHouseSchema)
  .handler(async ({ data }) => {
    const [newHouse] = await db.insert(houses).values(data).returning()
    return newHouse satisfies InsertHouse
  })

export const updateHouse = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateHouseSchema)
  .handler(async ({ data }) => {
    const { houseId, ...updateData } = data
    const [updatedHouse] = await db.update(houses).set(updateData).where(eq(houses.id, houseId)).returning()
    return updatedHouse satisfies SelectHouse
  })

export const getHouses = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const allHouses = await db.query.houses.findMany({
      with: {
        owner: true,
      },
      orderBy: (houses, { asc }) => [asc(houses.houseNumber)],
    })

    return allHouses satisfies HouseWithOwner[]
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

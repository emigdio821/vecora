import { createServerFn } from '@tanstack/react-start'
import { isNull } from 'drizzle-orm'
import { db } from '@/db'
import { houses } from '@/db/schemas/main'
import type { HouseWithOwner, SelectHouse } from '@/db/schemas/zod'
import { authAPIMiddleware } from '@/middleware/auth'

export const getHouses = createServerFn()
  .middleware([authAPIMiddleware])
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
  .middleware([authAPIMiddleware])
  .handler(async () => {
    const availableHouses = await db.query.houses.findMany({
      where: isNull(houses.ownerId),
      orderBy: (houses, { asc }) => [asc(houses.houseNumber)],
    })

    return availableHouses satisfies SelectHouse[]
  })

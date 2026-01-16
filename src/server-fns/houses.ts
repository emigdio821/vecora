import { createServerFn } from '@tanstack/react-start'
import { eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { houses } from '@/db/schemas/main'
import type { HouseWithOwner, SelectHouse } from '@/db/schemas/zod'
import { authAPIMiddleware } from '@/middleware/auth'

export const createHouseSchema = z.object({
  houseNumber: z.string().min(1, 'El número de casa es requerido'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  ownerId: z.uuid('ID de propietario inválido').nullable(),
})

export type CreateHouseFormData = z.infer<typeof createHouseSchema>

export const updateHouseSchema = z.object({
  houseId: z.uuid('ID de casa inválido'),
  houseNumber: z.string().min(1, 'El número de casa es requerido'),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  ownerId: z.uuid('ID de propietario inválido').nullable(),
})

export type UpdateHouseFormData = z.infer<typeof updateHouseSchema>

export const createHouse = createServerFn({ method: 'POST' })
  .middleware([authAPIMiddleware])
  .inputValidator(createHouseSchema)
  .handler(async ({ data }) => {
    const [newHouse] = await db.insert(houses).values(data).returning()
    return newHouse
  })

export const updateHouse = createServerFn({ method: 'POST' })
  .middleware([authAPIMiddleware])
  .inputValidator(updateHouseSchema)
  .handler(async ({ data }) => {
    const { houseId, ...updateData } = data
    const [updatedHouse] = await db.update(houses).set(updateData).where(eq(houses.id, houseId)).returning()
    return updatedHouse
  })

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

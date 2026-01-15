import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'
import { db } from '@/db'
import { houses, owners } from '@/db/schemas/main'
import type { OwnerWithRelations, SelectOwner } from '@/db/schemas/zod'
import { adminOnlyAPIMiddleware } from '@/middleware/admin'
import { authAPIMiddleware } from '@/middleware/auth'

export const getOwners = createServerFn()
  .middleware([authAPIMiddleware])
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

export const createOwnerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
  email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
  houseId: z.uuid('ID de casa inválido').nullable(),
})

export type CreateOwnerFormData = z.infer<typeof createOwnerSchema>

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

export const deleteOwnerSchema = z.object({
  ownerId: z.uuid('ID de propietario inválido'),
})

export type DeleteOwnerData = z.infer<typeof deleteOwnerSchema>

export const deleteOwner = createServerFn({ method: 'POST' })
  .middleware([adminOnlyAPIMiddleware])
  .inputValidator(deleteOwnerSchema)
  .handler(async ({ data }) => {
    await db.update(houses).set({ ownerId: null }).where(eq(houses.ownerId, data.ownerId))

    const [deletedOwner] = await db.delete(owners).where(eq(owners.id, data.ownerId)).returning()

    return deletedOwner satisfies SelectOwner
  })

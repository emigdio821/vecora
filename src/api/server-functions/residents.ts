import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { houses, residents } from '@/db/schema'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { createResidentSchema, deleteResidentSchema, updateResidentSchema } from '@/schemas/residents'

export const getResidents = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const residentsData = await db.query.residents.findMany({
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
      orderBy: (resident, { desc }) => [desc(resident.updatedAt)],
    })

    // Filter out admin users (role is now on user object)
    const filteredResidents = residentsData.filter((resident) => resident.profile?.user?.role !== 'admin')

    return filteredResidents
  })

export const createResident = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createResidentSchema)
  .handler(async ({ data }) => {
    const [newResident] = await db
      .insert(residents)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        isOwner: data.isOwner,
        notes: data.notes,
      })
      .returning()

    // If this is an owner and has houses, link them
    if (data.isOwner && data.houseIds && data.houseIds.length > 0) {
      for (const houseId of data.houseIds) {
        await db.update(houses).set({ residentId: newResident.id }).where(eq(houses.id, houseId))
      }
    }

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'resident',
        entityId: newResident.id,
        newData: newResident,
      },
    }).catch(console.error)

    return newResident
  })

export const updateResident = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(updateResidentSchema)
  .handler(async ({ data }) => {
    const [oldResident] = await db.select().from(residents).where(eq(residents.id, data.residentId)).limit(1)

    const [updatedResident] = await db
      .update(residents)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        isOwner: data.isOwner,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(residents.id, data.residentId))
      .returning()

    // Update house associations if this is an owner
    if (data.isOwner && data.houseIds) {
      // First, unlink all houses from this resident
      await db.update(houses).set({ residentId: null }).where(eq(houses.residentId, data.residentId))

      // Then link the selected houses
      if (data.houseIds.length > 0) {
        for (const houseId of data.houseIds) {
          await db.update(houses).set({ residentId: updatedResident.id }).where(eq(houses.id, houseId))
        }
      }
    }

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'resident',
        entityId: updatedResident.id,
        oldData: oldResident,
        newData: updatedResident,
      },
    }).catch(console.error)

    return updatedResident
  })

export const deleteResident = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(deleteResidentSchema)
  .handler(async ({ data }) => {
    const [residentToDelete] = await db
      .select()
      .from(residents)
      .where(eq(residents.id, data.residentId))
      .limit(1)

    // Unlink houses before deleting
    await db.update(houses).set({ residentId: null }).where(eq(houses.residentId, data.residentId))

    const [deletedResident] = await db.delete(residents).where(eq(residents.id, data.residentId)).returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'resident',
        entityId: deletedResident.id,
        oldData: residentToDelete,
      },
    }).catch(console.error)

    return deletedResident
  })

import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { profileRoles, profiles } from '@/db/schemas/main'
import type { SelectRole } from '@/db/schemas/zod/profile-roles'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { createProfileSchema, deleteProfileSchema, updateProfileSchema } from '@/schemas/profiles'

export const getProfilesList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const profiles = await db.query.profiles.findMany({
      with: {
        owner: true,
        externalUser: true,
        profileRoles: {
          with: {
            role: true,
          },
        },
        user: true,
      },
      orderBy: (profiles, { desc }) => [desc(profiles.updatedAt)],
    })

    return profiles satisfies ProfileWithAllRelations[]
  })

export const getRolesList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const roles = await db.query.roles.findMany({
      orderBy: (roles, { asc }) => [asc(roles.name)],
    })

    return roles satisfies SelectRole[]
  })

export const createProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createProfileSchema)
  .handler(async ({ data }) => {
    // Create the profile
    const [newProfile] = await db
      .insert(profiles)
      .values({
        userId: data.userId,
        profileType: data.profileType,
        ownerId: data.ownerId,
        externalUserId: data.externalUserId,
      })
      .returning()

    // Create profile roles
    if (data.roleIds.length > 0) {
      await db.insert(profileRoles).values(
        data.roleIds.map((roleId) => ({
          profileId: newProfile.id,
          roleId,
        })),
      )
    }

    // Fetch the complete profile with relations
    const profileWithRelations = await db.query.profiles.findFirst({
      where: eq(profiles.id, newProfile.id),
      with: {
        owner: true,
        externalUser: true,
        profileRoles: {
          with: {
            role: true,
          },
        },
        user: true,
      },
    })

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'external_user', // Note: This might need adjustment based on profileType
        entityId: newProfile.id,
        newData: profileWithRelations,
      },
    }).catch(console.error)

    return profileWithRelations satisfies ProfileWithAllRelations
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(updateProfileSchema)
  .handler(async ({ data }) => {
    // Fetch old profile for audit log
    const oldProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      with: {
        owner: true,
        externalUser: true,
        profileRoles: {
          with: {
            role: true,
          },
        },
        user: true,
      },
    })

    // Update the profile
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        userId: data.userId,
        profileType: data.profileType,
        ownerId: data.ownerId,
        externalUserId: data.externalUserId,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, data.profileId))
      .returning()

    // Delete existing roles
    await db.delete(profileRoles).where(eq(profileRoles.profileId, data.profileId))

    // Insert new roles
    if (data.roleIds.length > 0) {
      await db.insert(profileRoles).values(
        data.roleIds.map((roleId) => ({
          profileId: updatedProfile.id,
          roleId,
        })),
      )
    }

    // Fetch the complete updated profile with relations
    const profileWithRelations = await db.query.profiles.findFirst({
      where: eq(profiles.id, updatedProfile.id),
      with: {
        owner: true,
        externalUser: true,
        profileRoles: {
          with: {
            role: true,
          },
        },
        user: true,
      },
    })

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'external_user', // Note: This might need adjustment based on profileType
        entityId: updatedProfile.id,
        oldData: oldProfile,
        newData: profileWithRelations,
      },
    }).catch(console.error)

    return profileWithRelations satisfies ProfileWithAllRelations
  })

export const deleteProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(deleteProfileSchema)
  .handler(async ({ data }) => {
    const oldProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, data.profileId),
      with: {
        owner: true,
        externalUser: true,
        profileRoles: {
          with: {
            role: true,
          },
        },
        user: true,
      },
    })

    await db.delete(profiles).where(eq(profiles.id, data.profileId))

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'external_user', // Note: This might need adjustment based on profileType
        entityId: data.profileId,
        oldData: oldProfile,
      },
    }).catch(console.error)

    return { success: true }
  })

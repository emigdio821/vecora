import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { profileRoles, profiles } from '@/db/schemas/main'
import type { SelectRole } from '@/db/schemas/zod/profile-roles'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'
import { auth } from '@/lib/auth'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import {
  banProfileSchema,
  createProfileSchema,
  deleteProfileSchema,
  updateProfileSchema,
} from '@/schemas/profiles'

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

    // Filter out admin users
    const filteredProfiles = profiles.filter(
      (profile) => !profile.profileRoles.some((pr) => pr.role.name === 'admin'),
    )

    return filteredProfiles satisfies ProfileWithAllRelations[]
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
    // Step 1: Fetch owner or external user to get their email and name
    const { externalUserId, ownerId, profileType, password, roleIds } = data

    let email: string = ''
    let name: string = ''

    if (data.profileType === 'owner' && ownerId) {
      const owner = await db.query.owners.findFirst({
        where: (owners, { eq }) => eq(owners.id, ownerId),
      })

      if (!owner) {
        throw new Error('Owner not found')
      }

      email = owner.email
      name = `${owner.firstName} ${owner.lastName}`
    } else if (data.profileType === 'external' && externalUserId) {
      const externalUser = await db.query.externalUsers.findFirst({
        where: (externalUsers, { eq }) => eq(externalUsers.id, externalUserId),
      })

      if (!externalUser) {
        throw new Error('External user not found')
      }

      email = externalUser.email
      name = `${externalUser.firstName} ${externalUser.lastName}`
    } else {
      throw new Error('Invalid profile type or missing owner/external user ID')
    }

    // Step 2: Create user account using better-auth
    const adminRole = await db.query.roles.findFirst({
      where: (roles, { eq }) => eq(roles.name, 'admin'),
    })

    const signUpResult = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: adminRole ? 'admin' : 'user',
      },
    })

    if (!signUpResult.user) {
      throw new Error('Failed to create user account')
    }

    const userId = signUpResult.user.id

    // Step 3: Create the profile
    const [newProfile] = await db
      .insert(profiles)
      .values({
        userId,
        ownerId,
        profileType,
        externalUserId,
      })
      .returning()

    // Step 4: Create profile roles
    if (roleIds.length > 0) {
      await db.insert(profileRoles).values(
        roleIds.map((roleId) => ({
          profileId: newProfile.id,
          roleId,
        })),
      )
    }

    // Step 5: Fetch the complete profile with relations
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

    if (!profileWithRelations) {
      throw new Error('Failed to fetch created profile')
    }

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'profile',
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

    if (!profileWithRelations) {
      throw new Error('Failed to fetch updated profile')
    }

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'profile',
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

    if (!oldProfile) {
      throw new Error('Profile not found')
    }

    const userId = oldProfile.userId

    await db.delete(profiles).where(eq(profiles.id, data.profileId))

    if (userId) {
      const headers = getRequestHeaders()
      await auth.api.revokeUserSessions({
        body: {
          userId,
        },
        headers,
      })

      await auth.api.removeUser({
        body: {
          userId,
        },
        headers,
      })
    }

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'profile',
        entityId: data.profileId,
        oldData: oldProfile,
      },
    }).catch(console.error)
  })

export const banProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(banProfileSchema)
  .handler(async ({ data }) => {
    const { userId, duration, reason } = data
    const headers = getRequestHeaders()

    function getBanExpiryDate() {
      if (!duration) return undefined

      const date = new Date(duration)
      const millis = date.getTime()
      const secs = Math.floor(millis / 1000)

      return secs
    }

    await auth.api.banUser({
      body: {
        userId,
        banReason: reason || 'Banned by admin',
        banExpiresIn: getBanExpiryDate(),
      },
      headers,
    })

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'profile',
        entityUserId: userId,
        oldData: null,
        newData: {
          banned: true,
          banReason: reason,
          banExpiresIn: duration,
        },
      },
    }).catch(console.error)
  })

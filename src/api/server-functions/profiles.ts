import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { auth } from '@/lib/auth'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import {
  banProfileSchema,
  createProfileSchema,
  deleteProfileSchema,
  unbanProfileSchema,
  updateProfileSchema,
} from '@/schemas/profiles'

export const getProfilesList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const profilesList = await db.query.profiles.findMany({
      with: {
        user: true,
        resident: true,
        hoaBoardMemberships: {
          where: (membership, { isNull }) => isNull(membership.deletedAt),
        },
      },
      orderBy: (profiles, { desc }) => [desc(profiles.updatedAt)],
    })

    const filteredProfiles = profilesList.filter((profile) => profile.user.role !== 'admin')

    return filteredProfiles
  })

export const createProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createProfileSchema)
  .handler(async ({ data }) => {
    // Step 1: Fetch resident to get their email and name
    const { residentId, password, role } = data

    const resident = await db.query.residents.findFirst({
      where: (residents, { eq }) => eq(residents.id, residentId),
    })

    if (!resident) {
      throw new Error('Resident not found')
    }

    const email = resident.email
    const name = `${resident.firstName} ${resident.lastName}`

    // Step 2: Create user account using better-auth with role
    const signUpResult = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: role || undefined, // Pass role to better-auth
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
        residentId,
      })
      .returning()

    // Step 4: Fetch the complete profile with relations
    const profileWithRelations = await db.query.profiles.findFirst({
      where: eq(profiles.id, newProfile.id),
      with: {
        resident: true,
        hoaBoardMemberships: {
          where: (membership, { isNull }) => isNull(membership.deletedAt),
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

    return profileWithRelations
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(updateProfileSchema)
  .handler(async ({ data }) => {
    const { residentId, userId, password, profileId, role } = data
    // Fetch old profile for audit log
    const oldProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      with: {
        resident: true,
        user: true,
      },
    })

    if (!oldProfile) {
      throw new Error('Profile not found')
    }

    // Check if resident has changed
    const residentChanged = residentId !== oldProfile.residentId
    const headers = getRequestHeaders()

    // Update user account if resident has changed
    if (residentChanged) {
      const resident = await db.query.residents.findFirst({
        where: (residents, { eq }) => eq(residents.id, residentId),
      })

      if (!resident) {
        throw new Error('Resident not found')
      }

      const email = resident.email
      const name = `${resident.firstName} ${resident.lastName}`

      // Update user account using better-auth API
      await auth.api.adminUpdateUser({
        body: {
          userId,
          data: {
            email,
            name,
          },
        },
        headers,
      })
    }

    // Update user role if changed
    if (role && role !== oldProfile.user?.role) {
      await auth.api.setRole({
        body: {
          userId,
          role,
        },
        headers,
      })
    }

    // Update password if provided
    if (password) {
      await auth.api.setUserPassword({
        body: {
          newPassword: password,
          userId,
        },
        headers,
      })
    }

    // Update the profile
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        userId: userId,
        residentId: residentId,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId))
      .returning()

    // Fetch the complete updated profile with relations
    const profileWithRelations = await db.query.profiles.findFirst({
      where: eq(profiles.id, updatedProfile.id),
      with: {
        resident: true,
        hoaBoardMemberships: {
          where: (membership, { isNull }) => isNull(membership.deletedAt),
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

    return profileWithRelations
  })

export const deleteProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(deleteProfileSchema)
  .handler(async ({ data }) => {
    const { profileId } = data
    const oldProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      with: {
        resident: true,
        user: true,
      },
    })

    if (!oldProfile) {
      throw new Error('Profile not found')
    }

    const userId = oldProfile.userId

    await db.delete(profiles).where(eq(profiles.id, profileId))

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
        entityId: profileId,
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

export const unbanProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(unbanProfileSchema)
  .handler(async ({ data }) => {
    const { userId } = data
    const headers = getRequestHeaders()

    await auth.api.unbanUser({
      body: {
        userId,
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
          banned: false,
        },
      },
    }).catch(console.error)
  })

import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { externalUsers, owners, profiles, roles, userRoles } from '@/db/schemas/main'
import { auth } from '@/lib/auth'

type CreateUserWithProfileInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
  userType: 'owner' | 'external'
  roleId: string
  existingOwnerId?: string
}

export const createUserWithProfile = createServerFn()
  .inputValidator((data: CreateUserWithProfileInput) => data)
  .handler(async ({ data }) => {
    // Step 1: Create auth user
    const authResult = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
      },
    })

    if (!authResult.user) {
      throw new Error('Failed to create user')
    }

    const userId = authResult.user.id

    try {
      // Step 2: Create owner or external user profile
      let ownerId: string | null = null
      let externalUserId: string | null = null

      if (data.userType === 'owner') {
        if (data.existingOwnerId) {
          // Link to existing owner
          ownerId = data.existingOwnerId
        } else {
          // Create new owner
          const [newOwner] = await db
            .insert(owners)
            .values({
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone || null,
              email: data.email,
              address: data.address || null,
            })
            .returning()
          ownerId = newOwner.id
        }
      } else {
        // Create external user
        const [newExternalUser] = await db
          .insert(externalUsers)
          .values({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || null,
            email: data.email,
            address: data.address || null,
          })
          .returning()
        externalUserId = newExternalUser.id
      }

      // Step 3: Create user profile link
      await db.insert(profiles).values({
        userId,
        profileType: data.userType,
        ownerId,
        externalUserId,
      })

      // Step 4: Assign role
      // First, get the role ID from the roles table
      const [role] = await db.select().from(roles).where(eq(roles.name, data.roleId)).limit(1)

      if (!role) {
        throw new Error(`Role ${data.roleId} not found`)
      }

      await db.insert(userRoles).values({
        userId,
        roleId: role.id,
      })

      return {
        success: true,
        user: authResult.user,
      }
    } catch (error) {
      // Rollback: Delete the auth user if profile creation fails
      // Note: This is a simplified approach. Consider using database transactions
      throw error
    }
  })

// Legacy function - kept for compatibility
export const createUser = createServerFn()
  .inputValidator((data: { name: string; email: string; password: string }) => data)
  .handler(async ({ data }) => {
    return auth.api.signUpEmail({
      body: data,
    })
  })

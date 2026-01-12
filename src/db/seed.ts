import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from './index'
import { user } from './schemas/auth'
import { externalUsers, profiles, roles, userRoles } from './schemas/main'

async function seed() {
  console.log('Seeding database...')
  console.log('Creating roles...')

  const rolesToInsert = [
    {
      name: 'admin',
      description: 'Full system access - can manage everything',
    },
    {
      name: 'president',
      description: 'Board president - oversees board decisions and operations',
    },
    {
      name: 'treasurer',
      description: 'Financial manager - handles budgets and expenses',
    },
    {
      name: 'maintainer',
      description: 'Maintenance coordinator - manages property maintenance',
    },
    {
      name: 'security',
      description: 'Security coordinator - manages security and access control',
    },
  ]

  await db.insert(roles).values(rolesToInsert).onConflictDoNothing()
  console.log('Creating admin user...')

  // Check if admin user already exists
  const existingAdmin = await db.select().from(user).where(eq(user.email, 'admin@resido.com')).limit(1)

  let adminUserId: string

  if (existingAdmin.length > 0) {
    console.log('Admin user already exists')
    adminUserId = existingAdmin[0].id
  } else {
    // Create admin user using better-auth API
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: 'admin@resido.com',
        password: 'admin123',
        name: 'Admin System',
      },
    })

    if (!signUpResult.user) {
      throw new Error('Failed to create admin user')
    }

    adminUserId = signUpResult.user.id
  }

  // Step 3: Create external user profile for admin
  const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, adminUserId)).limit(1)

  if (existingProfile.length === 0) {
    console.log('Creating admin profile...')

    // Create external user
    const [adminExternalUser] = await db
      .insert(externalUsers)
      .values({
        firstName: 'Admin',
        lastName: 'System',
        email: 'admin@resido.com',
        phone: null,
        address: null,
      })
      .returning()

    // Link to user profile
    await db.insert(profiles).values({
      userId: adminUserId,
      profileType: 'external',
      ownerId: null,
      externalUserId: adminExternalUser.id,
    })
  } else {
    console.log('Admin profile already exists')
  }

  const adminRole = await db.select().from(roles).where(eq(roles.name, 'admin')).limit(1)

  if (adminRole.length > 0) {
    const existingRole = await db.select().from(userRoles).where(eq(userRoles.userId, adminUserId)).limit(1)

    if (existingRole.length === 0) {
      console.log('Assigning admin role...')
      await db.insert(userRoles).values({
        userId: adminUserId,
        roleId: adminRole[0].id,
      })
    } else {
      console.log('Admin role already assigned')
    }
  }

  console.log('Database seeded successfully!')
  console.log('\nAdmin credentials:')
  console.log('Email: admin@resido.com')
  console.log('Password: admin123')
  console.log('\nAdvice: change the admin password after first login')
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })

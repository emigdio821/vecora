import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from './index'
import { externalUsers, profiles, user } from './schema'

async function seed() {
  console.log('Seeding database...')
  console.log('Creating admin user...')

  // Check if admin user already exists
  const existingAdmin = await db.select().from(user).where(eq(user.email, 'admin@resido.com')).limit(1)

  let adminUserId: string

  if (existingAdmin.length > 0) {
    console.log('Admin user already exists')
    adminUserId = existingAdmin[0].id
  } else {
    // Create admin user using better-auth API with admin role
    const signUpResult = await auth.api.createUser({
      body: {
        email: 'admin@resido.com',
        password: 'admin123',
        name: 'Administrador Resido',
        role: 'admin', // Role is managed by better-auth admin plugin
      },
    })

    if (!signUpResult.user) {
      throw new Error('Failed to create admin user')
    }

    adminUserId = signUpResult.user.id
    console.log('Admin user created successfully')
  }

  // Create external user profile for admin
  const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, adminUserId)).limit(1)

  if (existingProfile.length === 0) {
    // Create external user record
    const [adminExternalUser] = await db
      .insert(externalUsers)
      .values({
        firstName: 'Administrador',
        lastName: 'Resido',
        email: 'admin@resido.com',
        phone: '+528124135976', // fake number
        notes: 'System administrator - Full access to all sections',
      })
      .returning()

    // Link user to profile
    await db
      .insert(profiles)
      .values({
        userId: adminUserId,
        profileType: 'external',
        ownerId: null,
        externalUserId: adminExternalUser.id,
      })
      .returning()

    console.log('Admin profile created successfully')
  } else {
    console.log('Admin profile already exists')
  }

  console.log('\n✅ Database seeded successfully!')
  console.log('\n📋 Admin credentials:')
  console.log('   Email: admin@resido.com')
  console.log('   Password: admin123')
  console.log('   Role: admin (full access)')
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!')
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })

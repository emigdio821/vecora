import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, getRequestHeaders, getRequestUrl } from '@tanstack/react-start/server'
import { and, eq, inArray } from 'drizzle-orm'
import {
  type ActionResult,
  type DatabaseError,
  databaseError,
  postgrestErrorMessage,
} from '@/lib/action-result'
import { auth, createAccessToken } from '@/lib/auth'
import { type CurrentUser, getCurrentUser } from '@/lib/auth/current-user'
import { authMiddleware } from '@/lib/auth/middleware'
import { withCurrentUser } from '@/lib/db/current-user'
import { profiles, residents, userRoles } from '@/lib/db/schema'
import {
  type AddBoardMemberInput,
  addBoardMemberSchema,
  type AppRole,
  type SetPasswordInput,
  setPasswordSchema,
  type UpdateBoardMemberRolesInput,
  updateBoardMemberRolesSchema,
} from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'

// Raised by the guards on the main admin (admin@vecora.app).
const MAIN_ADMIN_PROTECTED = 'P0004'

function toMessage(error: DatabaseError, fallback: string) {
  if (error.code === MAIN_ADMIN_PROTECTED) {
    return m.board_main_admin_protected()
  }
  return postgrestErrorMessage(error, { fallback, unique: { profiles_email_key: m.board_email_taken() } })
}

/**
 * Board members = accounts holding at least one role. The resident link is
 * optional: an account created outside the app (seeds) may not be tied to the
 * registry yet. The main admin is the app's own account, not a board seat, so
 * it isn't listed. The rows keep the database's column names, the shape the
 * screens were built on.
 */
const fetchBoardMembersFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const members = await withCurrentUser((tx) =>
      tx.query.profiles.findMany({
        columns: { id: true, fullName: true },
        with: {
          userRolesUserId: { columns: { role: true } },
          residentsProfileId: {
            columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
            with: {
              propertyResidents: {
                columns: {},
                with: { property: { columns: { id: true, number: true } } },
              },
            },
          },
        },
        where: { isMainAdmin: false, userRolesUserId: true },
        orderBy: { fullName: 'asc' },
      }),
    )

    return members.map((member) => {
      const resident = member.residentsProfileId
      return {
        id: member.id,
        full_name: member.fullName,
        user_roles: member.userRolesUserId,
        resident: resident
          ? {
              id: resident.id,
              first_name: resident.firstName,
              last_name: resident.lastName,
              email: resident.email,
              phone: resident.phone,
              // property_id is required, so there's always a house; Drizzle types the join as optional anyway.
              property_residents: resident.propertyResidents.flatMap((link) =>
                link.property ? [{ property: link.property }] : [],
              ),
            }
          : null,
      }
    })
  })

export const fetchBoardMembers = () => fetchBoardMembersFn()

/**
 * Admin and president manage the board. RLS enforces the same on profiles and
 * user_roles, but issuing an access link goes past it, so every action checks
 * here first.
 */
async function requireBoardManager(): Promise<{ user: CurrentUser; isAdmin: boolean } | { error: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: m.common_no_permission() }

  const isAdmin = user.roles.includes('admin')
  if (!isAdmin && !user.roles.includes('president')) return { error: m.common_no_permission() }

  return { user, isAdmin }
}

/**
 * One-time sign-in link for the account, pointing at our own /auth/confirm
 * page, where a button (not the visit) spends it. Valid for an hour; the
 * person lands on /set-password, whether it's their first or a reset.
 */
async function createAccessLink(email: string): Promise<string | null> {
  let token: string
  try {
    token = await createAccessToken(email)
  } catch (error) {
    console.error('createAccessToken failed', error)
    return null
  }

  const origin = getRequestHeader('origin') || getRequestUrl({ xForwardedHost: true }).origin
  const url = new URL('/auth/confirm', origin)
  url.searchParams.set('token', token)
  return url.toString()
}

export interface InviteResult {
  /** Share by WhatsApp or copy; valid until the person opens it (or it expires). */
  link: string
  full_name: string
  phone: string
}

/**
 * Seats a resident on the board: creates their account if they have none,
 * grants the roles, and returns the invite link to hand over. The account,
 * the resident link and the roles land together, or not at all.
 */
const addBoardMemberFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: AddBoardMemberInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<InviteResult>> => {
    const parsed = addBoardMemberSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const manager = await requireBoardManager()
    if ('error' in manager) return manager

    const { resident_id, roles } = parsed.data
    if (roles.includes('admin') && !manager.isAdmin) {
      return { error: m.board_only_admin_grant_admin() }
    }

    // What the last step was, so a failure says which part didn't work.
    let failedMessage = m.board_account_create_failed()
    let seated: { error: string } | { email: string; fullName: string; phone: string }
    try {
      seated = await withCurrentUser(async (tx) => {
        const resident = await tx.query.residents.findFirst({
          columns: { id: true, firstName: true, lastName: true, email: true, phone: true, profileId: true },
          with: {
            profileProfileId: {
              columns: { email: true },
              with: { userRolesUserId: { columns: { role: true } } },
            },
          },
          where: { id: resident_id, deletedAt: { isNull: true } },
        })

        if (!resident) return { error: m.board_resident_not_found() }
        if (!resident.email) {
          return { error: m.board_resident_no_email() }
        }
        const account = resident.profileProfileId
        if (account && account.userRolesUserId.length > 0) {
          return { error: m.board_resident_already_member() }
        }

        const fullName = `${resident.firstName} ${resident.lastName}`
        let userId = resident.profileId
        // A returning member signs in with the email their account already has.
        let email = account?.email ?? resident.email.toLowerCase()

        if (userId === null) {
          const [created] = await tx
            .insert(profiles)
            .values({ email, fullName })
            .returning({ id: profiles.id, email: profiles.email })
          userId = created.id
          email = created.email

          failedMessage = m.board_link_account_failed()
          await tx.update(residents).set({ profileId: userId }).where(eq(residents.id, resident_id))
        }

        failedMessage = m.board_assign_roles_failed()
        const memberId = userId
        await tx.insert(userRoles).values(roles.map((role) => ({ userId: memberId, role })))

        return { email, fullName, phone: resident.phone }
      })
    } catch (error) {
      return { error: toMessage(databaseError(error), failedMessage) }
    }

    if ('error' in seated) return seated

    // On the board by now; if the link fails, "New access link" gets another.
    const link = await createAccessLink(seated.email)
    if (!link) {
      return { error: m.board_link_create_failed() }
    }

    return { data: { link, full_name: seated.fullName, phone: seated.phone } }
  })

export const addBoardMember = (input: AddBoardMemberInput) => addBoardMemberFn({ data: input })

/** A fresh link for someone who lost theirs or let it expire. */
const resendInviteFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<ActionResult<InviteResult>> => {
    const manager = await requireBoardManager()
    if ('error' in manager) return manager

    const profile = await withCurrentUser((tx) =>
      tx.query.profiles.findFirst({
        columns: { fullName: true, email: true },
        with: {
          userRolesUserId: { columns: { role: true } },
          residentsProfileId: { columns: { email: true, phone: true } },
        },
        where: { id: userId },
      }),
    )

    // The link signs in as that person, so it's as good as their account.
    if (profile?.userRolesUserId.some((r) => r.role === 'admin') && !manager.isAdmin) {
      return { error: m.board_only_admin_link_admin() }
    }
    const resident = profile?.residentsProfileId
    if (!profile || !resident?.email) {
      return { error: m.board_member_no_email() }
    }

    const link = await createAccessLink(profile.email)
    if (!link) {
      return { error: m.board_link_create_failed() }
    }

    return { data: { link, full_name: profile.fullName, phone: resident.phone } }
  })

export const resendInvite = (userId: string) => resendInviteFn({ data: userId })

const updateBoardMemberRolesFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { userId: string; input: UpdateBoardMemberRolesInput }) => data)
  .handler(async ({ data: { userId, input } }): Promise<ActionResult> => {
    const parsed = updateBoardMemberRolesSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const manager = await requireBoardManager()
    if ('error' in manager) return manager
    if (userId === manager.user.id) {
      return { error: m.board_cannot_change_own_roles() }
    }

    let failedMessage = m.board_read_roles_failed()
    try {
      const outcome = await withCurrentUser(async (tx) => {
        const currentRows = await tx
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, userId))

        const current = new Set<AppRole>(currentRows.map((r) => r.role))
        const next = new Set<AppRole>(parsed.data.roles)
        const toAdd = [...next].filter((role) => !current.has(role))
        const toRemove = [...current].filter((role) => !next.has(role))

        if ([...toAdd, ...toRemove].includes('admin') && !manager.isAdmin) {
          return { error: m.board_only_admin_change_admin() }
        }

        failedMessage = m.board_update_roles_failed()
        if (toRemove.length > 0) {
          await tx
            .delete(userRoles)
            .where(and(eq(userRoles.userId, userId), inArray(userRoles.role, toRemove)))
        }
        if (toAdd.length > 0) {
          await tx.insert(userRoles).values(toAdd.map((role) => ({ userId, role })))
        }
        return undefined
      })
      if (outcome) return outcome
    } catch (error) {
      return { error: toMessage(databaseError(error), failedMessage) }
    }

    return { data: undefined }
  })

export const updateBoardMemberRoles = (userId: string, input: UpdateBoardMemberRolesInput) =>
  updateBoardMemberRolesFn({ data: { userId, input } })

/**
 * Takes every role away. The account stays (their past movements point at it)
 * but with no roles they can no longer sign in, and they leave the board list.
 */
const removeBoardMemberFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<ActionResult> => {
    const manager = await requireBoardManager()
    if ('error' in manager) return manager
    if (userId === manager.user.id) {
      return { error: m.board_cannot_remove_self() }
    }

    try {
      const outcome = await withCurrentUser(async (tx) => {
        const rows = await tx
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, userId))
        if (rows.some((r) => r.role === 'admin') && !manager.isAdmin) {
          return { error: m.board_only_admin_remove_admin() }
        }

        const removed = await tx
          .delete(userRoles)
          .where(eq(userRoles.userId, userId))
          .returning({ role: userRoles.role })
        if (removed.length === 0) {
          return { error: m.common_no_permission() }
        }
        return undefined
      })
      if (outcome) return outcome
    } catch (error) {
      return { error: toMessage(databaseError(error), m.board_remove_member_failed()) }
    }

    return { data: undefined }
  })

export const removeBoardMember = (userId: string) => removeBoardMemberFn({ data: userId })

/**
 * First sign-in after an access link: the person chooses their password (a
 * new member, or someone who forgot theirs). Also the main admin's first
 * sign-in, away from the default password; the database clears
 * must_change_password once the password changes.
 *
 * No current password is asked for, so only those two kinds of session may
 * use it. Everyone else changes theirs with an access link (or, the main
 * admin, in Settings).
 */
const setPasswordFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: SetPasswordInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
    const parsed = setPasswordSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const user = await getCurrentUser()
    if (!user || (!user.mustSetPassword && !user.mustChangePassword)) {
      return { error: m.common_no_permission() }
    }

    const { password } = parsed.data
    try {
      const context = await auth.$context
      const credential = await context.internalAdapter.findCredentialAccount(user.id)

      let isSamePassword = false
      if (credential?.password) {
        isSamePassword = await context.password.verify({ hash: credential.password, password })
      }
      // Someone resetting who typed the password they already had: it's still
      // theirs, let them in. Unless it's the default one being replaced.
      if (isSamePassword && user.mustChangePassword) {
        return { error: m.auth_password_same_as_default() }
      }

      if (!isSamePassword) {
        const hash = await context.password.hash(password)
        if (credential) {
          await context.internalAdapter.updatePassword(user.id, hash)
        } else {
          await context.internalAdapter.createAccount({
            userId: user.id,
            providerId: 'credential',
            accountId: user.id,
            password: hash,
          })
        }
      }

      // Sign out every device, this access-link session included: it stays
      // marked as such (see CurrentUser.mustSetPassword), so it's replaced below.
      await context.internalAdapter.deleteUserSessions(user.id)
    } catch (error) {
      console.error('setPassword failed', error)
      return { error: m.board_password_save_failed() }
    }

    try {
      await auth.api.signInEmail({ body: { email: user.email, password }, headers: getRequestHeaders() })
    } catch (error) {
      console.error('signInEmail after setPassword failed', error)
      return { error: m.board_password_saved_sign_in_failed() }
    }

    return { data: undefined }
  })

export const setPassword = (input: SetPasswordInput) => setPasswordFn({ data: input })

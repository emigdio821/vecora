// The HOA board: who holds which role. A board member is a resident with an
// account whose role (users.role) isn't empty; only they may sign in.
//
//   * Admin and president manage the board (permission board.manage); only an
//     admin hands out, takes away or links for the admin role.
//   * Nobody changes their own roles or takes themselves off the board.
//   * The main admin (admin@vecora.app) is the app's own account: it keeps the
//     admin role, its name and its email, and isn't listed on the board.
//   * Someone taken off the board keeps the account (their past movements
//     point at it) but loses every session, so it counts at once.
import { and, eq, isNull, ne, sql } from 'drizzle-orm'
import { type AppRole, formatRoles, parseRoles } from '@/lib/auth/roles'
import type { Transaction } from '@/lib/db/client'
import { residents, sessions, users } from '@/lib/db/schema'
import { type Actor, isAdmin } from './actor'
import { ServiceError } from './errors'

/** Who an access link is for, to share it with them. */
export interface AccessLinkTarget {
  email: string
  name: string
  phone: string
}

/** The account of a board member, with what the rules below look at. */
async function findAccount(tx: Transaction, userId: string) {
  const account = await tx.query.users.findFirst({
    columns: { id: true, role: true, isMainAdmin: true },
    where: { id: userId },
  })
  if (!account) {
    throw new ServiceError('not_found', `user ${userId}`)
  }
  return { ...account, roles: parseRoles(account.role) }
}

/** Whether another account than `userId` signs in with `email`. */
export async function isEmailTaken(tx: Transaction, email: string, userId: string | null): Promise<boolean> {
  const conditions = [eq(users.email, email.toLowerCase())]
  if (userId !== null) {
    conditions.push(ne(users.id, userId))
  }
  const [taken] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(...conditions))
    .limit(1)
  return taken !== undefined
}

/**
 * Seats a resident on the board: creates their account if they have none
 * (named after them, signing in with their email) and gives it `roles`. A
 * returning member gets their old account back, with the email it has.
 */
export async function seatBoardMember(
  tx: Transaction,
  actor: Actor,
  input: { residentId: string; roles: AppRole[] },
): Promise<AccessLinkTarget & { userId: string }> {
  if (input.roles.includes('admin') && !isAdmin(actor)) {
    throw new ServiceError('admin_only')
  }

  const resident = await tx.query.residents.findFirst({
    columns: { id: true, firstName: true, lastName: true, email: true, phone: true, userId: true },
    with: { user: { columns: { email: true, role: true } } },
    where: { id: input.residentId, deletedAt: { isNull: true } },
  })
  if (!resident) {
    throw new ServiceError('not_found', `resident ${input.residentId}`)
  }
  if (!resident.email) {
    throw new ServiceError('resident_no_email')
  }
  if (resident.user && parseRoles(resident.user.role).length > 0) {
    throw new ServiceError('already_member')
  }

  const name = `${resident.firstName} ${resident.lastName}`
  const role = formatRoles(input.roles)

  if (resident.userId !== null && resident.user) {
    await tx.update(users).set({ name, role }).where(eq(users.id, resident.userId))
    return { userId: resident.userId, email: resident.user.email, name, phone: resident.phone }
  }

  const email = resident.email.toLowerCase()
  if (await isEmailTaken(tx, email, null)) {
    throw new ServiceError('email_taken')
  }
  const [created] = await tx.insert(users).values({ name, email, role }).returning({ id: users.id })
  await tx.update(residents).set({ userId: created.id }).where(eq(residents.id, resident.id))

  return { userId: created.id, email, name, phone: resident.phone }
}

/** Replaces a member's roles with `roles` (at least one; removeBoardMember takes them all). */
export async function updateBoardMemberRoles(
  tx: Transaction,
  actor: Actor,
  input: { userId: string; roles: AppRole[] },
): Promise<void> {
  if (input.userId === actor.id) {
    throw new ServiceError('self_change')
  }

  const account = await findAccount(tx, input.userId)
  const wasAdmin = account.roles.includes('admin')
  const willBeAdmin = input.roles.includes('admin')
  if (account.isMainAdmin && !willBeAdmin) {
    throw new ServiceError('main_admin_protected')
  }
  if (wasAdmin !== willBeAdmin && !isAdmin(actor)) {
    throw new ServiceError('admin_only')
  }

  await tx
    .update(users)
    .set({ role: formatRoles(input.roles) })
    .where(eq(users.id, input.userId))
}

/**
 * Takes every role away and ends the member's sessions. The account stays,
 * for history, but can't sign in again until someone seats them anew.
 */
export async function removeBoardMember(tx: Transaction, actor: Actor, userId: string): Promise<void> {
  if (userId === actor.id) {
    throw new ServiceError('self_change')
  }

  const account = await findAccount(tx, userId)
  if (account.isMainAdmin) {
    throw new ServiceError('main_admin_protected')
  }
  if (account.roles.includes('admin') && !isAdmin(actor)) {
    throw new ServiceError('admin_only')
  }
  if (account.roles.length === 0) {
    throw new ServiceError('not_found', `board member ${userId}`)
  }

  await tx.update(users).set({ role: null }).where(eq(users.id, userId))
  await tx.delete(sessions).where(eq(sessions.userId, userId))
}

/**
 * Who a new access link for `userId` is for. The link signs in as them, so
 * it's as good as their account: one for an admin takes an admin.
 */
export async function accessLinkTarget(
  tx: Transaction,
  actor: Actor,
  userId: string,
): Promise<AccessLinkTarget> {
  const account = await tx.query.users.findFirst({
    columns: { email: true, name: true, role: true },
    with: { resident: { columns: { email: true, phone: true } } },
    where: { id: userId },
  })
  if (!account || parseRoles(account.role).length === 0) {
    throw new ServiceError('not_found', `board member ${userId}`)
  }
  if (parseRoles(account.role).includes('admin') && !isAdmin(actor)) {
    throw new ServiceError('admin_only')
  }
  if (!account.resident?.email) {
    throw new ServiceError('resident_no_email')
  }

  return { email: account.email, name: account.name, phone: account.resident.phone }
}

/** Closes the welcome dialog for good, on every device. Bookkeeping: the activity log skips it. */
export async function markWelcomed(tx: Transaction, userId: string): Promise<void> {
  await tx
    .update(users)
    .set({ welcomedAt: sql`now()` })
    .where(and(eq(users.id, userId), isNull(users.welcomedAt)))
}

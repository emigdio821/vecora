import type { AuthError, PostgrestError, User } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, getRequestUrl } from '@tanstack/react-start/server'
import { type ActionResult, postgrestErrorMessage } from '@/lib/action-result'
import { createAdminClient } from '@/lib/supabase/admin'
import { type CurrentUser, getCurrentUser } from '@/lib/supabase/current-user'
import { createClient } from '@/lib/supabase/server'
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

// Raised by the guards on the main admin (admin@vecora.com).
const MAIN_ADMIN_PROTECTED = 'P0004'

function toMessage(error: PostgrestError, fallback: string) {
  if (error.code === MAIN_ADMIN_PROTECTED) {
    return m.board_main_admin_protected()
  }
  return postgrestErrorMessage(error, { fallback })
}

/**
 * Admin and president manage the board. RLS enforces the same on user_roles,
 * but the Auth Admin API bypasses RLS, so every action checks here first.
 */
async function requireBoardManager(): Promise<{ user: CurrentUser; isAdmin: boolean } | { error: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: m.common_no_permission() }

  const isAdmin = user.roles.includes('admin')
  if (!isAdmin && !user.roles.includes('president')) return { error: m.common_no_permission() }

  return { user, isAdmin }
}

/**
 * One-time sign-in link for the invited person, pointing at our own
 * /auth/confirm page so the session lands in cookies (SSR) instead of the
 * URL hash. Auth refuses `invite` once the account exists (`email_exists`), so
 * existing accounts (re-sends, re-added members) get a `recovery` link instead;
 * both land on /set-password.
 */
async function createInviteLink(
  email: string,
  fullName: string,
  hasAccount: boolean,
): Promise<{ error: AuthError } | { user: User; link: string }> {
  const admin = createAdminClient()
  const { data, error } = hasAccount
    ? await admin.auth.admin.generateLink({ type: 'recovery', email })
    : await admin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { data: { full_name: fullName } },
      })
  if (error) {
    console.error('generateLink failed', error)
    return { error }
  }

  const origin = getRequestHeader('origin') ?? getRequestUrl({ xForwardedHost: true }).origin
  const url = new URL('/auth/confirm', origin)
  url.searchParams.set('token_hash', data.properties.hashed_token)
  url.searchParams.set('type', data.properties.verification_type)

  return { user: data.user, link: url.toString() }
}

export interface InviteResult {
  /** Share by WhatsApp or copy; valid until the person opens it (or it expires). */
  link: string
  full_name: string
  phone: string
}

/**
 * Seats a resident on the board: creates their account if they have none,
 * grants the roles, and returns the invite link to hand over.
 */
const addBoardMemberFn = createServerFn({ method: 'POST' })
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

    const supabase = await createClient()
    const { data: resident } = await supabase
      .from('residents')
      .select(
        'id, first_name, last_name, email, phone, profile_id, profile:profiles!profile_id ( user_roles!user_id ( role ) )',
      )
      .eq('id', resident_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (!resident) return { error: m.board_resident_not_found() }
    if (!resident.email) {
      return { error: m.board_resident_no_email() }
    }
    if (resident.profile?.user_roles.length) {
      return { error: m.board_resident_already_member() }
    }

    const fullName = `${resident.first_name} ${resident.last_name}`
    const isNewAccount = resident.profile_id === null
    const invite = await createInviteLink(resident.email, fullName, !isNewAccount)
    if ('error' in invite) {
      return {
        error: invite.error.code === 'email_exists' ? m.board_email_taken() : m.board_account_create_failed(),
      }
    }

    const userId = invite.user.id

    // Undo the account if the registry side fails; there is no history to keep yet.
    const rollback = async () => {
      if (isNewAccount) await createAdminClient().auth.admin.deleteUser(userId)
    }

    if (isNewAccount) {
      const { error } = await supabase.from('residents').update({ profile_id: userId }).eq('id', resident_id)
      if (error) {
        await rollback()
        return { error: toMessage(error, m.board_link_account_failed()) }
      }
    }

    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert(roles.map((role) => ({ user_id: userId, role })))
    if (rolesError) {
      if (isNewAccount) {
        await supabase.from('residents').update({ profile_id: null }).eq('id', resident_id)
      }
      await rollback()
      return { error: toMessage(rolesError, m.board_assign_roles_failed()) }
    }

    return { data: { link: invite.link, full_name: fullName, phone: resident.phone } }
  })

export const addBoardMember = (input: AddBoardMemberInput) => addBoardMemberFn({ data: input })

/** A fresh link for someone who lost theirs or let it expire. */
const resendInviteFn = createServerFn({ method: 'POST' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<ActionResult<InviteResult>> => {
    const manager = await requireBoardManager()
    if ('error' in manager) return manager

    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, user_roles!user_id ( role ), resident:residents!profile_id ( email, phone )')
      .eq('id', userId)
      .maybeSingle()

    // The link signs in as that person, so it's as good as their account.
    if (profile?.user_roles.some((r) => r.role === 'admin') && !manager.isAdmin) {
      return { error: m.board_only_admin_link_admin() }
    }
    if (!profile?.resident?.email) {
      return { error: m.board_member_no_email() }
    }

    const invite = await createInviteLink(profile.resident.email, profile.full_name, true)
    if ('error' in invite) {
      return { error: m.board_link_create_failed() }
    }

    return { data: { link: invite.link, full_name: profile.full_name, phone: profile.resident.phone } }
  })

export const resendInvite = (userId: string) => resendInviteFn({ data: userId })

const updateBoardMemberRolesFn = createServerFn({ method: 'POST' })
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

    const supabase = await createClient()
    const { data: currentRows, error: readError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    if (readError) {
      return { error: toMessage(readError, m.board_read_roles_failed()) }
    }

    const current = new Set<AppRole>(currentRows.map((r) => r.role))
    const next = new Set<AppRole>(parsed.data.roles)
    const toAdd = [...next].filter((role) => !current.has(role))
    const toRemove = [...current].filter((role) => !next.has(role))

    if ([...toAdd, ...toRemove].includes('admin') && !manager.isAdmin) {
      return { error: m.board_only_admin_change_admin() }
    }

    if (toRemove.length > 0) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).in('role', toRemove)
      if (error) return { error: toMessage(error, m.board_update_roles_failed()) }
    }
    if (toAdd.length > 0) {
      const { error } = await supabase
        .from('user_roles')
        .insert(toAdd.map((role) => ({ user_id: userId, role })))
      if (error) return { error: toMessage(error, m.board_update_roles_failed()) }
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
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }): Promise<ActionResult> => {
    const manager = await requireBoardManager()
    if ('error' in manager) return manager
    if (userId === manager.user.id) {
      return { error: m.board_cannot_remove_self() }
    }

    const supabase = await createClient()
    const { data: rows, error: readError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    if (readError) {
      return { error: toMessage(readError, m.board_remove_member_failed()) }
    }
    if (rows.some((r) => r.role === 'admin') && !manager.isAdmin) {
      return { error: m.board_only_admin_remove_admin() }
    }

    const { data, error } = await supabase.from('user_roles').delete().eq('user_id', userId).select('role')
    if (error) {
      return { error: toMessage(error, m.board_remove_member_failed()) }
    }
    if (data.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const removeBoardMember = (userId: string) => removeBoardMemberFn({ data: userId })

/** First sign-in after an invite: the person chooses their password. */
const setPasswordFn = createServerFn({ method: 'POST' })
  .validator((input: SetPasswordInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
    const parsed = setPasswordSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const supabase = await createClient()
    const { data: claims } = await supabase.auth.getClaims()
    const email = claims?.claims.email
    if (!email) return { error: m.common_no_permission() }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
    // Someone resetting who typed the password they already had: it's still theirs, let them in.
    if (error && error.code !== 'same_password') {
      return { error: m.board_password_save_failed() }
    }

    // The link session stays marked as such (see CurrentUser.mustSetPassword), so
    // replace it with a regular sign-in; otherwise the app keeps sending them here.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    })
    if (signInError) {
      return { error: m.board_password_saved_sign_in_failed() }
    }

    // Sign out every other device. Auth already ends the other sessions on a
    // password change, but keeps the link session we just replaced, and does
    // nothing on the same_password path.
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' })
    if (signOutError) console.error('signOut others failed', signOutError)

    return { data: undefined }
  })

export const setPassword = (input: SetPasswordInput) => setPasswordFn({ data: input })

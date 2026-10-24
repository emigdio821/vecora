import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, getRequestUrl } from '@tanstack/react-start/server'
import { type ActionResult, errorMessage } from '@/lib/action-result'
import { createAccessToken } from '@/lib/auth'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { parseRoles } from '@/lib/auth/roles'
import { db, transactionAs } from '@/lib/db'
import * as board from '@/lib/services/board'
import {
  type AddBoardMemberInput,
  addBoardMemberSchema,
  type UpdateBoardMemberRolesInput,
  updateBoardMemberRolesSchema,
} from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'

const boardManage = requirePermission({ board: ['manage'] })

/**
 * Board members = accounts holding at least one role. The resident link is
 * optional: an account created outside the app (seeds) may not be tied to the
 * registry yet. The main admin is the app's own account, not a board seat, so
 * it isn't listed.
 */
const fetchBoardMembersFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(async () => {
    const members = await db.query.users.findMany({
      columns: { id: true, name: true, role: true },
      with: {
        resident: {
          columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
          with: {
            propertyLinks: {
              columns: {},
              with: { property: { columns: { id: true, number: true } } },
              where: { property: { deletedAt: { isNull: true } } },
            },
          },
        },
      },
      where: { isMainAdmin: false, role: { isNotNull: true, ne: '' } },
      orderBy: { name: 'asc' },
    })

    return members.map(({ role, ...member }) => ({ ...member, roles: parseRoles(role) }))
  })

export const fetchBoardMembers = () => fetchBoardMembersFn()

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
  name: string
  phone: string
}

/**
 * Seats a resident on the board: creates their account if they have none,
 * grants the roles, and returns the invite link to hand over. The account,
 * the resident link and the roles land together, or not at all.
 */
const addBoardMemberFn = createServerFn({ method: 'POST' })
  .middleware([boardManage])
  .validator((input: AddBoardMemberInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<InviteResult>> => {
    const parsed = addBoardMemberSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    let seated: board.AccessLinkTarget
    try {
      seated = await transactionAs(context.user.id, (tx) =>
        board.seatBoardMember(tx, context.user, parsed.data),
      )
    } catch (error) {
      return {
        error: errorMessage(error, {
          fallback: m.board_account_create_failed(),
          service: {
            admin_only: m.board_only_admin_grant_admin(),
            not_found: m.board_resident_not_found(),
            resident_no_email: m.board_resident_no_email(),
            already_member: m.board_resident_already_member(),
            email_taken: m.board_email_taken(),
          },
          uniqueFallback: m.board_email_taken(),
        }),
      }
    }

    // On the board by now; if the link fails, "New access link" gets another.
    const link = await createAccessLink(seated.email)
    if (!link) {
      return { error: m.board_link_create_failed() }
    }

    return { data: { link, name: seated.name, phone: seated.phone } }
  })

export const addBoardMember = (input: AddBoardMemberInput) => addBoardMemberFn({ data: input })

/** A fresh link for someone who lost theirs or let it expire. */
const resendInviteFn = createServerFn({ method: 'POST' })
  .middleware([boardManage])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId, context }): Promise<ActionResult<InviteResult>> => {
    let target: board.AccessLinkTarget
    try {
      target = await transactionAs(context.user.id, (tx) => board.accessLinkTarget(tx, context.user, userId))
    } catch (error) {
      return {
        error: errorMessage(error, {
          fallback: m.board_link_create_failed(),
          service: {
            admin_only: m.board_only_admin_link_admin(),
            not_found: m.board_member_no_email(),
            resident_no_email: m.board_member_no_email(),
          },
        }),
      }
    }

    const link = await createAccessLink(target.email)
    if (!link) {
      return { error: m.board_link_create_failed() }
    }

    return { data: { link, name: target.name, phone: target.phone } }
  })

export const resendInvite = (userId: string) => resendInviteFn({ data: userId })

const updateBoardMemberRolesFn = createServerFn({ method: 'POST' })
  .middleware([boardManage])
  .validator((data: { userId: string; input: UpdateBoardMemberRolesInput }) => data)
  .handler(async ({ data: { userId, input }, context }): Promise<ActionResult> => {
    const parsed = updateBoardMemberRolesSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      await transactionAs(context.user.id, (tx) =>
        board.updateBoardMemberRoles(tx, context.user, { userId, roles: parsed.data.roles }),
      )
    } catch (error) {
      return {
        error: errorMessage(error, {
          fallback: m.board_update_roles_failed(),
          service: {
            self_change: m.board_cannot_change_own_roles(),
            admin_only: m.board_only_admin_change_admin(),
            main_admin_protected: m.board_main_admin_protected(),
            not_found: m.board_update_roles_failed(),
          },
        }),
      }
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
  .middleware([boardManage])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) => board.removeBoardMember(tx, context.user, userId))
    } catch (error) {
      return {
        error: errorMessage(error, {
          fallback: m.board_remove_member_failed(),
          service: {
            self_change: m.board_cannot_remove_self(),
            admin_only: m.board_only_admin_remove_admin(),
            main_admin_protected: m.board_main_admin_protected(),
            not_found: m.board_remove_member_failed(),
          },
        }),
      }
    }

    return { data: undefined }
  })

export const removeBoardMember = (userId: string) => removeBoardMemberFn({ data: userId })

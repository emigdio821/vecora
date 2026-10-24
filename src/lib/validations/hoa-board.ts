import { z } from 'zod'
import { APP_ROLES } from '@/lib/auth/roles'
import { m } from '@/paraglide/messages'

export { APP_ROLES, type AppRole } from '@/lib/auth/roles'

const rolesField = z.array(z.enum(APP_ROLES)).min(1, { error: () => m.board_select_role() })

/** Give a resident an account and seat them on the board. */
export const addBoardMemberSchema = z.object({
  residentId: z.uuid({ error: () => m.board_select_resident() }),
  roles: rolesField,
})

export type AddBoardMemberInput = z.infer<typeof addBoardMemberSchema>

export const updateBoardMemberRolesSchema = z.object({
  roles: rolesField,
})

export type UpdateBoardMemberRolesInput = z.infer<typeof updateBoardMemberRolesSchema>

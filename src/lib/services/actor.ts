import type { AppRole } from '@/lib/auth/roles'

/**
 * Who a service acts for: the signed-in user (CurrentUser fits), or the board
 * member a seed step plays. Whether they may write at all is the server
 * function's check (requirePermission); the services check the rules that
 * depend on the rows, like who may touch the admin role.
 */
export interface Actor {
  id: string
  roles: readonly AppRole[]
}

export function isAdmin(actor: Actor): boolean {
  return actor.roles.includes('admin')
}

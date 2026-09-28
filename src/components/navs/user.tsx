'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { CurrentUser } from '@/lib/supabase/current-user'
import { getAvatarFallback } from '@/lib/utils'
import { logout } from '@/server-actions/auth'
import { RoleNameBadge } from '../shared/role-name-badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '../ui/menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar'
import { toastManager } from '../ui/toast'

interface NavUserProps {
  user: CurrentUser
}

export function NavUser({ user }: NavUserProps) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await logout()
      if (result?.error) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.clear()
      router.replace('/login')
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'Error', description: error.message })
    },
  })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label="Menú de usuario"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar>
                    <AvatarFallback>{getAvatarFallback(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 gap-1 text-left leading-none">
                    <span className="truncate font-medium">{user.fullName}</span>
                    {/* One row only: the button is fixed-height, so extra roles clip instead of wrapping. */}
                    <div className="flex gap-1 overflow-hidden">
                      {user.roles.length ? (
                        user.roles.map((role) => <RoleNameBadge key={role} size="sm" roleName={role} />)
                      ) : (
                        <Badge variant="outline" size="sm">
                          Miembro
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SidebarMenuButton>
            }
          />
          <MenuPopup className="w-(--anchor-width)" align="center">
            <MenuGroup>
              <div>
                <MenuGroupLabel className="line-clamp-2 pb-0">{user.fullName}</MenuGroupLabel>
                <MenuGroupLabel className="line-clamp-2 py-0">{user.email}</MenuGroupLabel>
              </div>
            </MenuGroup>

            <MenuSeparator />

            <MenuItem
              disabled={logoutMutation.isPending}
              onClick={() => {
                logoutMutation.mutate()
              }}
            >
              Cerrar sesión
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

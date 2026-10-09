import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { CurrentUser } from '@/lib/supabase/current-user'
import { getAvatarFallback } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { logout } from '@/server-actions/auth'
import { RoleNameBadge } from '../shared/role-name-badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '../ui/menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../ui/sidebar'
import { toastManager } from '../ui/toast'
import { useWelcomeParam } from '../welcome-dialog'

interface NavUserProps {
  user: CurrentUser
}

export function NavUser({ user }: NavUserProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const [, setWelcome] = useWelcomeParam()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await logout()
      if (result?.error) throw new Error(result.error)
    },
    onSuccess: async () => {
      queryClient.clear()
      await navigate({ to: '/login', replace: true })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_error(), description: error.message })
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
                aria-label={m.common_user_menu()}
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar>
                    <AvatarFallback className="bg-linear-to-br from-primary to-emerald-900 font-medium text-white">
                      {getAvatarFallback(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 gap-1 text-left leading-none">
                    <span className="truncate font-medium">{user.fullName}</span>
                    <div className="flex gap-1 overflow-hidden">
                      {user.roles.length ? (
                        user.roles.map((role) => <RoleNameBadge key={role} size="sm" roleName={role} />)
                      ) : (
                        <Badge variant="outline" size="sm">
                          {m.common_member()}
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
              onClick={() => {
                // On mobile the sidebar is a sheet that would sit over the dialog.
                setOpenMobile(false)
                void setWelcome(true)
              }}
            >
              {m.common_view_intro()}
            </MenuItem>

            <MenuItem
              disabled={logoutMutation.isPending}
              onClick={() => {
                logoutMutation.mutate()
              }}
            >
              {m.common_sign_out()}
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

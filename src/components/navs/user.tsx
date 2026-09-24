'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import type { CurrentUser } from '@/lib/supabase/current-user'
import { getAvatarFallback } from '@/lib/utils'
import { logout } from '@/server-actions/auth'
import { RoleNameBadge } from '../shared/role-name-badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from '../ui/menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar'
import { toastManager } from '../ui/toast'

interface NavUserProps {
  user: CurrentUser
}

export function NavUser({ user }: NavUserProps) {
  const { theme, setTheme } = useTheme()
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
                size="default"
                aria-label="Menú de usuario"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback>{getAvatarFallback(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">{user.fullName}</span>
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

              <MenuGroupLabel>
                <div className="flex flex-wrap gap-1">
                  {user.roles.length ? (
                    user.roles.map((role) => <RoleNameBadge key={role} className="text-xs" roleName={role} />)
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Miembro
                    </Badge>
                  )}
                </div>
              </MenuGroupLabel>
            </MenuGroup>

            <MenuSeparator />

            <MenuSub>
              <MenuSubTrigger>Apariencia</MenuSubTrigger>

              <MenuSubPopup>
                <MenuRadioGroup
                  value={theme}
                  onValueChange={(value) => {
                    setTheme(value)
                  }}
                >
                  <MenuRadioItem value="light">Claro</MenuRadioItem>
                  <MenuRadioItem value="dark">Oscuro</MenuRadioItem>
                  <MenuRadioItem value="system">Sistema</MenuRadioItem>
                </MenuRadioGroup>
              </MenuSubPopup>
            </MenuSub>

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

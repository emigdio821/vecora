import { IconLogout, IconMoon, IconRefresh, IconSelector, IconSettings, IconSun } from '@tabler/icons-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTheme } from 'tanstack-theme-kit'
import { userProfileQueryOptions } from '@/api/tanstack-queries/user'
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuPortal,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from '@/components/ui/menu'
import { authClient } from '@/lib/auth-client'
import { logger } from '@/lib/logger'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar'
import { Skeleton } from '../ui/skeleton'

export function NavUser() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  const { data: profile, isLoading, error, refetch } = useQuery(userProfileQueryOptions())

  async function handleLogOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          queryClient.clear()
          navigate({ to: '/login', reloadDocument: true })
        },
        onError: (error) => {
          logger.error('Error during sign out:', error)
        },
      },
    })
  }

  if (isLoading) return <Skeleton className="h-12 rounded-lg" />

  if (error || !profile)
    return (
      <SidebarMenuButton onClick={() => refetch()} size="lg">
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">Refetch profile</span>
        </div>
        <IconRefresh className="ml-auto size-4" />
      </SidebarMenuButton>
    )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <Avatar>
                  <AvatarFallback>{profile.firstName.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{profile.firstName}</p>
                  <p className="truncate text-muted-foreground text-xs">{profile.email}</p>
                </div>
                <IconSelector className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <MenuPopup className="w-(--anchor-width)" align="center">
            <MenuGroup>
              <MenuSub>
                <MenuSubTrigger>
                  <IconMoon className="hidden size-4 dark:block" />
                  <IconSun className="size-4 dark:hidden" />
                  <span>Apariencia</span>
                </MenuSubTrigger>
                <MenuPortal>
                  <MenuSubPopup>
                    <MenuCheckboxItem checked={theme === 'light'} onClick={() => setTheme('light')}>
                      Claro
                    </MenuCheckboxItem>
                    <MenuCheckboxItem checked={theme === 'dark'} onClick={() => setTheme('dark')}>
                      Oscuro
                    </MenuCheckboxItem>
                    <MenuCheckboxItem checked={theme === 'system'} onClick={() => setTheme('system')}>
                      Sistema
                    </MenuCheckboxItem>
                  </MenuSubPopup>
                </MenuPortal>
              </MenuSub>
            </MenuGroup>

            <MenuGroup>
              <MenuItem
                render={
                  <Link to="/settings">
                    <IconSettings className="size-4" />
                    Configuración
                  </Link>
                }
              />
            </MenuGroup>

            <MenuSeparator />

            <MenuGroup>
              <MenuItem onClick={handleLogOut}>
                <IconLogout className="size-4" />
                Cerrar sesión
              </MenuItem>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

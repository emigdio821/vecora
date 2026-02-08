import { IconLogout, IconMoon, IconRefresh, IconSelector, IconSun } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserRoles } from '@/hooks/use-user-roles'
import { authClient } from '@/lib/auth-client'
import { logger } from '@/lib/logger'
import { RoleNameBadge } from '../shared/role-name-badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar'
import { Skeleton } from '../ui/skeleton'

export function NavUser() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  const { profile, isLoading, error, refetch } = useUserRoles()

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

  function getAvatarFallback() {
    if (!profile) return null

    const profileName = profile.user.name
    const fallabck = `${profileName.split(' ')[0].charAt(0)}${profileName.split(' ')[1]?.charAt(0) ?? ''}`

    return fallabck
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar>
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="truncate font-medium">{profile.user.name.split(' ')[0]}</p>
                    <p className="truncate text-muted-foreground text-xs">{profile.user.email}</p>
                  </div>
                </div>
                <IconSelector className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent className="w-(--anchor-width)" align="center">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="line-clamp-2">{profile.user.name}</DropdownMenuLabel>
              <DropdownMenuLabel>
                <div className="flex flex-wrap gap-1">
                  {profile.profileRoles.map(({ role }) => (
                    <RoleNameBadge className="text-xs" key={role.id} roleName={role.name} />
                  ))}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <IconMoon className="hidden size-4 dark:block" />
                  <IconSun className="size-4 dark:hidden" />
                  <span>Apariencia</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem checked={theme === 'light'} onClick={() => setTheme('light')}>
                      Claro
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={theme === 'dark'} onClick={() => setTheme('dark')}>
                      Oscuro
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={theme === 'system'} onClick={() => setTheme('system')}>
                      Sistema
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            {/* <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link to="/settings">
                    <IconSettings className="size-4" />
                    Configuración
                  </Link>
                }
              />
            </DropdownMenuGroup> */}

            {/* <DropdownMenuSeparator /> */}

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogOut}>
                <IconLogout className="size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

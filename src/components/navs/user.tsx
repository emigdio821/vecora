'use client'

import { LogOutIcon, MonitorIcon, MoonIcon, SettingsIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn, getAvatarFallback } from '@/lib/utils'
import { RoleNameBadge } from '../shared/role-name-badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
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

export function NavUser() {
  const { theme, setTheme } = useTheme()

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
                    <AvatarFallback>{getAvatarFallback('Some name')}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">Some name</span>
                </div>
              </SidebarMenuButton>
            }
          />
          <MenuPopup className="w-(--anchor-width)" align="center">
            <MenuGroup>
              <div>
                <MenuGroupLabel className="line-clamp-2 pb-0">Some name</MenuGroupLabel>
                <MenuGroupLabel className="line-clamp-2 py-0">some.email@example.com</MenuGroupLabel>
              </div>

              <MenuGroupLabel>
                <div className="flex flex-wrap gap-1">
                  <RoleNameBadge className="text-xs" roleName="admin" />
                </div>
              </MenuGroupLabel>
            </MenuGroup>

            <MenuSeparator />

            <MenuSub>
              <MenuSubTrigger>
                <SunIcon className={cn('size-4', theme !== 'light' && 'hidden')} />
                <MoonIcon className={cn('size-4', theme !== 'dark' && 'hidden')} />
                <MonitorIcon className={cn('size-4', theme !== 'system' && 'hidden')} />
                Apariencia
              </MenuSubTrigger>

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

            <MenuItem>
              <SettingsIcon className="size-4" />
              Configuración
            </MenuItem>
            <MenuItem>
              <LogOutIcon className="size-4" />
              Cerrar sesión
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

import { IconRosette, IconUser, IconUserScan, IconUserStar, IconWind } from '@tabler/icons-react'
import type { ProfileQueryData } from '@/api/tanstack-queries/profiles'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { ProfileStatusBadge } from '@/components/shared/users/profile-status-badge'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
import { FramePanel } from '@/components/ui/frame'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/utils'

interface ProfileDetailsSheetProps {
  profile: ProfileQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function ProfileDetailsSheet({ profile, state }: ProfileDetailsSheetProps) {
  const { isOpen, onOpenChange } = state

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información del perfil</SheetTitle>
          <SheetDescription>Información completa y detallada del perfil</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Profile info */}
          <CollapsibleDetails
            title="Información del perfil"
            icon={IconUserStar}
            content={
              <div className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">ID del perfil</h2>
                    <p className="line-clamp-2 font-mono text-muted-foreground text-sm">{profile.id}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={profile.id} />
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Tipo de perfil</h2>
                  <RoleNameBadge roleName={profile.user.role || ''} />
                </FramePanel>
              </div>
            }
          />

          {/* User info */}
          {profile.user && (
            <CollapsibleDetails
              title="Usuario de autenticación"
              icon={IconUserScan}
              content={
                <div className="space-y-1">
                  <FramePanel className="flex items-center gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">ID de usuario</h2>
                      <p className="line-clamp-2 font-mono text-muted-foreground text-sm">
                        {profile.user.id}
                      </p>
                    </div>
                    <CopyButton tooltipText="Copiar ID" value={profile.user.id} />
                  </FramePanel>

                  {profile.user.email && (
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Email</h2>
                      <p className="line-clamp-2 text-muted-foreground text-sm">{profile.user.email}</p>
                    </FramePanel>
                  )}

                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Estado</h2>
                    <ProfileStatusBadge className="mt-1" banned={!!profile.user.banned} />
                    {profile.user.banReason && (
                      <p className="mt-1 text-muted-foreground text-sm">{profile.user.banReason}</p>
                    )}
                  </FramePanel>
                </div>
              }
            />
          )}

          {/* Resident info */}
          <CollapsibleDetails
            title="Residente"
            icon={IconUser}
            content={
              profile.resident ? (
                <div className="space-y-1">
                  <FramePanel className="flex items-center gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">Nombre</h2>
                      <p className="line-clamp-2 text-muted-foreground text-sm">
                        {`${profile.resident.firstName} ${profile.resident.lastName}`.trim()}
                      </p>
                    </div>
                    <CopyButton tooltipText="Copiar ID" value={profile.resident.id} />
                  </FramePanel>

                  {profile.resident.email && (
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Correo</h2>
                      <p className="line-clamp-2 text-muted-foreground text-sm">{profile.resident.email}</p>
                    </FramePanel>
                  )}

                  {profile.resident.phone && (
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Teléfono</h2>
                      <p className="line-clamp-2 text-muted-foreground text-sm">{profile.resident.phone}</p>
                    </FramePanel>
                  )}
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>No hay información del residente</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </FramePanel>
              )
            }
          />

          {/* Roles info */}
          <CollapsibleDetails
            title="Rol"
            icon={IconRosette}
            content={
              profile.user.role ? (
                <FramePanel className="flex items-center gap-2 p-2">
                  <RoleNameBadge roleName={profile.user.role} />
                </FramePanel>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Sin roles asignados</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </FramePanel>
              )
            }
          />
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha de creación</span>
            <span>{formatDate(profile.createdAt)}</span>
          </div>
          {profile.updatedAt &&
            new Date(profile.updatedAt).getTime() > new Date(profile.createdAt).getTime() && (
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Última actualización</span>
                <span>{formatDate(profile.updatedAt)}</span>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

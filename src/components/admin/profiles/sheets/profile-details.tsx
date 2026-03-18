import { IconUser, IconUserStar, IconWind } from '@tabler/icons-react'
import type React from 'react'
import type { ProfileQueryData } from '@/api/tanstack-queries/profiles'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { ProfileStatusBadge } from '@/components/shared/users/profile-status-badge'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { isSuperAdmin as isSuperAdmon } from '@/lib/auth/rbac'
import { formatDate } from '@/lib/utils'

interface ProfileDetailsSheetProps extends React.ComponentProps<typeof Sheet> {
  profile: ProfileQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDetailsSheet({ profile, open, onOpenChange, ...props }: ProfileDetailsSheetProps) {
  const isSuperAdmin = isSuperAdmon(profile.user)

  return (
    <Sheet open={open} onOpenChange={onOpenChange} {...props}>
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
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">ID de perfil</h2>
                    <p className="line-clamp-2 font-mono text-muted-foreground text-xs">{profile.id}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID del perfil" value={profile.id} />
                </div>

                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">ID de usuario</h2>
                    <p className="line-clamp-2 font-mono text-muted-foreground text-xs">{profile.user.id}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID de usuario" value={profile.user.id} />
                </div>

                {profile.resident && (
                  <div>
                    <h2 className="font-medium text-sm">Tipo de perfil</h2>
                    <ProfileTypeBadge isOwner={profile.resident.isOwner} />
                  </div>
                )}

                {profile.user.role && (
                  <div>
                    <h2 className="font-medium text-sm">Rol</h2>
                    <RoleNameBadge roleName={profile.user.role} />
                  </div>
                )}

                <div>
                  <h2 className="font-medium text-sm">Estatus</h2>
                  <ProfileStatusBadge className="mt-1" banned={!!profile.user.banned} />
                  {profile.user.banReason && (
                    <p className="mt-1 text-muted-foreground text-sm">{profile.user.banReason}</p>
                  )}
                </div>
              </div>
            }
          />

          {/* Resident info */}
          {!isSuperAdmin && (
            <CollapsibleDetails
              title="Residente"
              icon={IconUser}
              content={
                profile.resident ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-medium text-sm">Nombre</h2>
                        <p className="line-clamp-2 text-muted-foreground text-sm">
                          {`${profile.resident.firstName} ${profile.resident.lastName}`.trim()}
                        </p>
                      </div>
                      <CopyButton tooltipText="Copiar ID" value={profile.resident.id} />
                    </div>

                    {profile.resident.email && (
                      <div>
                        <h2 className="font-medium text-sm">Correo</h2>
                        <p className="line-clamp-2 text-muted-foreground text-sm">{profile.resident.email}</p>
                      </div>
                    )}

                    {profile.resident.phone && (
                      <div>
                        <h2 className="font-medium text-sm">Teléfono</h2>
                        <p className="line-clamp-2 text-muted-foreground text-sm">{profile.resident.phone}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Empty className="p-1">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-0">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>No hay información del residente</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </div>
                )
              }
            />
          )}
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

import { IconCalendarTime, IconUser, IconUserStar, IconWind } from '@tabler/icons-react'
import type React from 'react'
import type { HoaBoardMemberQueryData } from '@/api/tanstack-queries/hoa-board'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { MemberStatusBadge } from '@/components/shared/member-status-badge'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
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
import { formatDate } from '@/lib/utils'

interface MemberDetailsSheetProps extends React.ComponentProps<typeof Sheet> {
  member: HoaBoardMemberQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HoaMemberDetailsSheet({ member, open, onOpenChange, ...props }: MemberDetailsSheetProps) {
  const memberFullName = `${member.firstName} ${member.lastName}`.trim()
  const isActive = !!member.profileId
  const period = member.period
  const profile = member.profile

  return (
    <Sheet open={open} onOpenChange={onOpenChange} {...props}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información del miembro de la mesa directiva</SheetTitle>
          <SheetDescription>Información completa y detallada del miembro</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Member info */}
          <CollapsibleDetails
            title="Información del miembro"
            icon={IconUser}
            content={
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Nombre completo</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{memberFullName}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={member.id} />
                </div>

                <div>
                  <h2 className="font-medium text-sm">Correo</h2>
                  <div className="mt-1">
                    <p className="line-clamp-2 text-muted-foreground text-sm">{member.email}</p>
                  </div>
                </div>

                <div>
                  <h2 className="font-medium text-sm">Teléfono</h2>
                  <div className="mt-1">
                    <p className="line-clamp-2 text-muted-foreground text-sm">{member.phone}</p>
                  </div>
                </div>

                <div>
                  <h2 className="font-medium text-sm">Tipo de perfil</h2>
                  <div className="mt-1">
                    <ProfileTypeBadge isOwner={member.isOwner} />
                  </div>
                </div>

                <div>
                  <h2 className="font-medium text-sm">Estado</h2>
                  <div className="mt-1">
                    <MemberStatusBadge deleted={!isActive} />
                  </div>
                </div>
              </div>
            }
          />

          {/* Profile info */}
          <CollapsibleDetails
            title="Perfil asociado"
            icon={IconUserStar}
            content={
              profile?.user ? (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Rol</h2>
                    <RoleNameBadge className="mt-1" roleName={profile.user.role || ''} />
                  </div>
                  <CopyButton tooltipText="Copiar ID del perfil asociado" value={profile.id} />
                </div>
              ) : (
                <div>
                  <Empty className="gap-2 p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <div>
                        <EmptyHeader>Sin perfil asociado</EmptyHeader>
                        <EmptyDescription>Este miembro ha sido eliminado del sistema</EmptyDescription>
                      </div>
                    </EmptyHeader>
                  </Empty>
                </div>
              )
            }
          />

          {/* Period info */}
          {period && (
            <CollapsibleDetails
              title="Periodo"
              icon={IconCalendarTime}
              content={
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">Fecha inicial</h2>
                      <p className="text-muted-foreground text-sm">{formatDate(period.startDate)}</p>
                    </div>
                    <CopyButton tooltipText="Copiar ID del periodo" value={member.periodId} />
                  </div>

                  <div>
                    <h2 className="font-medium text-sm">Fecha final</h2>
                    <p className="text-muted-foreground text-sm">{formatDate(period.endDate)}</p>
                  </div>
                </div>
              }
            />
          )}
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha de registro</span>
            <span>{formatDate(member.createdAt)}</span>
          </div>
          {member.updatedAt &&
            new Date(member.updatedAt).getTime() > new Date(member.createdAt).getTime() && (
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Última actualización</span>
                <span>{formatDate(member.updatedAt)}</span>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

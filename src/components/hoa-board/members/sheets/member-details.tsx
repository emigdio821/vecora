import { IconCalendarTime, IconUser, IconUserStar } from '@tabler/icons-react'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { MemberStatusBadge } from '@/components/shared/member-status-badge'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
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
import type { HoaBoardMemberWithProfile } from '@/db/schemas/zod/hoa-board'
import { formatDate } from '@/lib/utils'

interface MemberDetailsSheetProps {
  member: HoaBoardMemberWithProfile
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function HoaMemberDetailsSheet({ member, state }: MemberDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const memberFullName = `${member.firstName} ${member.lastName}`.trim()
  const isActive = !!member.profileId

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
              <div className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Nombre completo</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{memberFullName}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={member.id} />
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Tipo de perfil</h2>
                  <div className="mt-1">
                    <ProfileTypeBadge type={member.profileType} />
                  </div>
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Estado</h2>
                  <div className="mt-1">
                    <MemberStatusBadge deleted={!isActive} />
                  </div>
                </FramePanel>
              </div>
            }
          />

          {/* Profile info */}
          <CollapsibleDetails
            title="Perfil asociado"
            icon={IconUserStar}
            content={
              member.profile ? (
                <div className="space-y-1">
                  <FramePanel className="flex items-center gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">ID del perfil</h2>
                      <p className="font-mono text-muted-foreground text-sm">{member.profile.id}</p>
                    </div>
                    <CopyButton tooltipText="Copiar ID del perfil" value={member.profile.id} />
                  </FramePanel>

                  {member.profile.profileRoles.length > 0 && (
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Rol</h2>
                      <div className="mt-1">
                        <RoleNameBadge roleName={member.profile.profileRoles[0]?.role.name || 'Sin rol'} />
                      </div>
                    </FramePanel>
                  )}
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyMedia className="size-8" />
                    <EmptyHeader>Sin perfil asociado</EmptyHeader>
                    <EmptyDescription>Este miembro ha sido eliminado del sistema</EmptyDescription>
                  </Empty>
                </FramePanel>
              )
            }
          />

          {/* Period info */}
          <CollapsibleDetails
            title="Periodo"
            icon={IconCalendarTime}
            content={
              <FramePanel className="flex items-center gap-2 p-2">
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-sm">ID del periodo</h2>
                  <p className="font-mono text-muted-foreground text-sm">{member.periodId}</p>
                </div>
                <CopyButton tooltipText="Copiar ID del periodo" value={member.periodId} />
              </FramePanel>
            }
          />
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

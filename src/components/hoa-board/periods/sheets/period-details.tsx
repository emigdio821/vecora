import { IconCalendarTime, IconUsers, IconWind } from '@tabler/icons-react'
import type { HoaBoardPeriodQueryData } from '@/api/tanstack-queries/hoa-board'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { Badge } from '@/components/ui/badge'
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
import { cn, formatDate } from '@/lib/utils'

interface HoaPeriodDetailsSheetProps {
  period: HoaBoardPeriodQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function HoaPeriodDetailsSheet({ period, state }: HoaPeriodDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const activeMembers = period.members?.filter((member) => !member.deletedAt) || []
  const pastMembers = period.members?.filter((member) => member.deletedAt) || []

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información del periodo</SheetTitle>
          <SheetDescription>
            Información completa y detallada del periodo de la mesa directiva
          </SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Period info */}
          <CollapsibleDetails
            title="Información del periodo"
            icon={IconCalendarTime}
            content={
              <div className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Fecha inicial</h2>
                    <p className="text-muted-foreground text-sm">{formatDate(period.startDate)}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID del periodo" value={period.id} />
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Fecha final</h2>
                  <p className="text-muted-foreground text-sm">{formatDate(period.endDate)}</p>
                </FramePanel>
              </div>
            }
          />

          {/* Members info */}
          <CollapsibleDetails
            title={
              <>
                Miembros <Badge variant="outline">{activeMembers.length}</Badge>
              </>
            }
            icon={IconUsers}
            content={
              activeMembers.length > 0 ? (
                <div className="space-y-1">
                  {activeMembers.map((member) => {
                    const memberFullName = `${member.firstName} ${member.lastName}`.trim()
                    const isDeleted = !member.profileId

                    return (
                      <FramePanel key={member.id} className="p-0">
                        <div className="flex items-center justify-between gap-2 p-2">
                          <div className="min-w-0 flex-1">
                            <h2 className={cn('font-medium text-sm', isDeleted && 'text-muted-foreground')}>
                              {memberFullName}
                            </h2>
                            <p className="text-muted-foreground text-sm">{member.email}</p>
                            <p className="text-muted-foreground text-sm">{member.phone}</p>
                          </div>
                          <CopyButton tooltipText="Copiar ID" value={member.id} />
                        </div>
                        <div className="flex flex-wrap gap-2 p-2 pt-0">
                          <RoleNameBadge roleName={member.profile?.user?.role || ''} />
                          <ProfileTypeBadge isOwner={member.isOwner} />
                          {isDeleted && <Badge variant="destructive">Eliminado</Badge>}
                        </div>
                      </FramePanel>
                    )
                  })}
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="gap-2 p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>Este periodo no tiene miembros asignados</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </FramePanel>
              )
            }
          />

          {pastMembers.length > 0 && (
            <CollapsibleDetails
              title={
                <>
                  Miembros pasados <Badge variant="outline">{pastMembers.length}</Badge>
                </>
              }
              icon={IconUsers}
              content={
                <div className="space-y-1">
                  {pastMembers.map((member) => {
                    const memberFullName = `${member.firstName} ${member.lastName}`.trim()

                    return (
                      <FramePanel key={member.id} className="flex items-center gap-2 p-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-medium text-sm">{memberFullName}</h2>
                          {member.phone && <p className="text-muted-foreground text-xs">{member.phone}</p>}
                          <div className="flex flex-wrap gap-2">
                            <RoleNameBadge roleName={member.profile?.user?.role || ''} />
                            <ProfileTypeBadge isOwner={member.isOwner} />
                          </div>
                        </div>
                        <CopyButton tooltipText="Copiar ID" value={member.id} />
                      </FramePanel>
                    )
                  })}
                </div>
              }
            />
          )}
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha de creación</span>
            <span>{formatDate(period.createdAt)}</span>
          </div>
          {period.updatedAt &&
            new Date(period.updatedAt).getTime() > new Date(period.createdAt).getTime() && (
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Última actualización</span>
                <span>{formatDate(period.updatedAt)}</span>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

import { IconCalendarTime, IconChevronDown, IconUsers } from '@tabler/icons-react'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'
import { Frame, FrameHeader, FramePanel } from '@/components/ui/frame'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { HoaBoardPeriodWithMembers } from '@/db/schemas/zod/hoa-board'
import { cn, formatDate } from '@/lib/utils'

interface PeriodDetailsSheetProps {
  period: HoaBoardPeriodWithMembers
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function PeriodDetailsSheet({ period, state }: PeriodDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const membersCount = period.members?.length ?? 0

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
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Información del periodo
                </CollapsibleTrigger>
                <IconCalendarTime className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent className="space-y-1">
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
              </CollapsibleContent>
            </Collapsible>
          </Frame>

          {/* Members info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Miembros <Badge variant="outline">{membersCount}</Badge>
                </CollapsibleTrigger>
                <IconUsers className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent>
                {period.members && period.members.length > 0 ? (
                  <div className="space-y-1">
                    {period.members.map((member) => {
                      const memberFullName = `${member.firstName} ${member.lastName}`.trim()
                      const isDeleted = !member.profileId
                      const roleName = member.profile?.profileRoles[0]?.role.name || 'Sin rol'

                      return (
                        <FramePanel key={member.id} className="p-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <h2
                                  className={cn('font-medium text-sm', isDeleted && 'text-muted-foreground')}
                                >
                                  {memberFullName}
                                </h2>
                              </div>
                              <CopyButton tooltipText="Copiar ID" value={member.id} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <RoleNameBadge roleName={roleName} />
                              <ProfileTypeBadge type={member.profileType} />
                              {isDeleted && <Badge variant="destructive">Eliminado</Badge>}
                            </div>
                          </div>
                        </FramePanel>
                      )
                    })}
                  </div>
                ) : (
                  <Empty className="py-4">
                    <EmptyMedia className="size-8" />
                    <EmptyHeader>Sin miembros</EmptyHeader>
                    <EmptyDescription>Este periodo no tiene miembros asignados</EmptyDescription>
                  </Empty>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Frame>
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

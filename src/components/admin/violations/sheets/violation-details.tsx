import { IconFlag, IconUserHeart, IconWind } from '@tabler/icons-react'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { ViolationStatusBadge } from '@/components/shared/violations/status-badge'
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
import type { ViolationWithOwner } from '@/db/schema/zod/violations'
import { formatDate } from '@/lib/utils'

interface ViolationDetailsSheetProps {
  violation: ViolationWithOwner
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function ViolationDetailsSheet({ violation, state }: ViolationDetailsSheetProps) {
  const { isOpen, onOpenChange } = state

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información de la infracción</SheetTitle>
          <SheetDescription>Información completa y detallada de la infracción</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Violation info */}
          <CollapsibleDetails
            title="Información de la infracción"
            icon={IconFlag}
            content={
              <div className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Concepto</h2>
                    <p className="line-clamp-3 text-muted-foreground text-sm">{violation.concept}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={violation.id} />
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Monto</h2>
                  <p className="text-muted-foreground text-sm">${violation.amount}</p>
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Fecha de infracción</h2>
                  <p className="text-muted-foreground text-sm">{formatDate(violation.violationDate)}</p>
                </FramePanel>

                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Estado</h2>
                  <ViolationStatusBadge className="mt-1" status={violation.status} />
                </FramePanel>
              </div>
            }
          />

          {/* Owner info */}
          <CollapsibleDetails
            title="Propietario"
            icon={IconUserHeart}
            content={
              violation.owner ? (
                <div className="space-y-1">
                  <FramePanel className="flex items-center gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">Nombre</h2>
                      <p className="text-muted-foreground text-sm">{`${violation.owner.firstName} ${violation.owner.lastName}`}</p>
                    </div>
                    <CopyButton tooltipText="Copiar ID" value={violation.owner.id} />
                  </FramePanel>

                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Correo</h2>
                    <p className="text-muted-foreground text-sm">{violation.owner.email}</p>
                  </FramePanel>

                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Teléfono</h2>
                    <p className="text-muted-foreground text-sm">{violation.owner.phone}</p>
                  </FramePanel>
                </div>
              ) : (
                <FramePanel className="p-2">
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>No tiene propietario asignado.</EmptyDescription>
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
            <span>Fecha de registro</span>
            <span>{formatDate(violation.createdAt)}</span>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

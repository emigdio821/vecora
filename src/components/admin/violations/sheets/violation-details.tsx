import { IconChevronDown, IconFlag, IconUserHeart, IconWind } from '@tabler/icons-react'
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
import type { ViolationWithOwner } from '@/db/schemas/zod/violations'
import { cn, formatDate } from '@/lib/utils'

interface ViolationDetailsSheetProps {
  violation: ViolationWithOwner
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function ViolationDetailsSheet({ violation, state }: ViolationDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const isPaid = violation.status === 'paid'

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información de la infracción</SheetTitle>
          <SheetDescription>Información completa y detallada de la infracción</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Violation info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Información de la infracción
                </CollapsibleTrigger>
                <IconFlag className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent className="space-y-1">
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
                  <Badge variant="outline">
                    <span
                      aria-hidden
                      className={cn('size-1.5 rounded-full', isPaid ? 'bg-success' : 'bg-warning')}
                    />
                    {isPaid ? 'Pagada' : 'Pendiente'}
                  </Badge>
                </FramePanel>
              </CollapsibleContent>
            </Collapsible>
          </Frame>

          {/* Owner info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Propietario
                </CollapsibleTrigger>
                <IconUserHeart className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent>
                {violation.owner ? (
                  <div className="space-y-1">
                    <FramePanel className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-medium text-sm">Nombre</h2>
                          <p className="text-muted-foreground text-sm">{`${violation.owner.firstName} ${violation.owner.lastName}`}</p>
                        </div>
                        <CopyButton tooltipText="Copiar ID" value={violation.owner.id} />
                      </div>
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
                    <Empty className="p-0 md:p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon" className="mb-1">
                          <IconWind />
                        </EmptyMedia>
                        <EmptyDescription>No tiene propietario asignado.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </FramePanel>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Frame>
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

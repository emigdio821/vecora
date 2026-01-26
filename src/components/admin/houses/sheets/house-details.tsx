import { IconChevronDown, IconHome, IconUserHeart, IconWind } from '@tabler/icons-react'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
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
import type { HouseWithOwner } from '@/db/schemas/zod/houses'
import { formatDate } from '@/lib/utils'

interface HouseDetailsSheetProps {
  house: HouseWithOwner
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function HouseDetailsSheet({ house, state }: HouseDetailsSheetProps) {
  const { isOpen, onOpenChange } = state
  const houseAddress = [house.street, house.city, house.state].filter(Boolean).join(', ')

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información de la casa</SheetTitle>
          <SheetDescription>Información completa y detallada de la casa</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* House info */}
          <Frame className="w-full">
            <Collapsible defaultOpen>
              <FrameHeader className="flex-row items-center justify-between p-2">
                <CollapsibleTrigger
                  className="data-panel-open:[&_svg]:rotate-180"
                  render={<Button variant="plain" />}
                >
                  <IconChevronDown className="size-4" />
                  Información de la casa
                </CollapsibleTrigger>
                <IconHome className="size-4 text-muted-foreground" />
              </FrameHeader>
              <CollapsibleContent className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Número de casa</h2>
                    <HouseNumberBadge number={house.houseNumber} />
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={house.id} />
                </FramePanel>
                {houseAddress && (
                  <FramePanel className="p-2">
                    <h2 className="font-medium text-sm">Direccón</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{houseAddress}</p>
                  </FramePanel>
                )}
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
                {house.owner ? (
                  <div className="space-y-1">
                    <FramePanel className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <h2 className="font-medium text-sm">Nombre</h2>
                          <p className="text-muted-foreground text-sm">{`${house.owner.firstName} ${house.owner.lastName}`}</p>
                        </div>
                        <CopyButton tooltipText="Copiar ID" value={house.id} />
                      </div>
                    </FramePanel>
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Correo</h2>
                      <p className="text-muted-foreground text-sm">{house.owner.email}</p>
                    </FramePanel>
                    <FramePanel className="p-2">
                      <h2 className="font-medium text-sm">Teléfono</h2>
                      <p className="text-muted-foreground text-sm">{house.owner.phone}</p>
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
            <span>{formatDate(house.createdAt)}</span>
          </div>
          {house.updatedAt && new Date(house.updatedAt).getTime() > new Date(house.createdAt).getTime() && (
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Última actualización</span>
              <span>{formatDate(house.updatedAt)}</span>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

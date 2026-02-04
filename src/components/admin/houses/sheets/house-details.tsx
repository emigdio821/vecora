import { IconHome, IconUserHeart, IconWind } from '@tabler/icons-react'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
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
          <CollapsibleDetails
            title="Información de la casa"
            icon={IconHome}
            content={
              <div className="space-y-1">
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
              </div>
            }
          />

          {/* Owner info */}
          <CollapsibleDetails
            title="Propietario"
            icon={IconUserHeart}
            content={
              house.owner ? (
                <div className="space-y-1">
                  <FramePanel className="flex items-center gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">Nombre</h2>
                      <p className="text-muted-foreground text-sm">{`${house.owner.firstName} ${house.owner.lastName}`}</p>
                    </div>
                    <CopyButton tooltipText="Copiar ID" value={house.id} />
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

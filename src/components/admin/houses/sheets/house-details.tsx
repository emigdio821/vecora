import { IconHome, IconUserHeart, IconWind } from '@tabler/icons-react'
import type { HouseQueryData } from '@/api/tanstack-queries/houses'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
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

interface HouseDetailsSheetProps {
  house: HouseQueryData
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
              <>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Número de casa</h2>
                    <HouseNumberBadge number={house.houseNumber} />
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={house.id} />
                </div>
                {houseAddress && (
                  <div>
                    <h2 className="font-medium text-sm">Direccón</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{houseAddress}</p>
                  </div>
                )}
              </>
            }
          />

          {/* Owner info */}
          <CollapsibleDetails
            title="Propietario"
            icon={IconUserHeart}
            content={
              house.resident ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-medium text-sm">Nombre</h2>
                      <p className="text-muted-foreground text-sm">{`${house.resident.firstName} ${house.resident.lastName}`}</p>
                    </div>
                    <CopyButton tooltipText="Copiar ID" value={house.id} />
                  </div>

                  <div>
                    <h2 className="font-medium text-sm">Correo</h2>
                    <p className="text-muted-foreground text-sm">{house.resident.email}</p>
                  </div>

                  <div>
                    <h2 className="font-medium text-sm">Teléfono</h2>
                    <p className="text-muted-foreground text-sm">{house.resident.phone}</p>
                  </div>
                </>
              ) : (
                <div>
                  <Empty className="p-1">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" className="mb-0">
                        <IconWind />
                      </EmptyMedia>
                      <EmptyDescription>No tiene propietario asignado</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
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

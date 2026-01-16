import { IconHome, IconMail, IconMapPin, IconPhone, IconUser, IconUserHeart } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CopyButton } from '@/components/ui/copy-button'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { HouseWithOwner } from '@/db/schemas/zod'
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
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Información de la casa</SheetTitle>
          <SheetDescription>Información completa y detallada de la casa</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {/* House info */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger
              render={
                <Button variant="plain">
                  <span className="flex items-center gap-2">
                    <IconHome className="size-4 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground text-sm">Información de la casa</h3>
                  </span>
                </Button>
              }
            />
            <CollapsibleContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline">{house.houseNumber}</Badge>
                    <p className="truncate font-mono text-muted-foreground text-xs">{house.id}</p>
                  </div>
                  <CopyButton value={house.id} />
                </div>

                {houseAddress && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <IconMapPin className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Dirección</p>
                      <p className="line-clamp-2 text-sm">{houseAddress}</p>
                      {house.zipCode && <p className="text-xs">CP: {house.zipCode}</p>}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Owner info */}
          <Collapsible defaultOpen className="space-y-2">
            <CollapsibleTrigger
              render={
                <Button variant="plain">
                  <span className="flex items-center gap-2">
                    <IconUserHeart className="size-4 text-muted-foreground" />
                    <h3 className="font-medium text-muted-foreground text-sm">Propietario</h3>
                  </span>
                </Button>
              }
            />
            <CollapsibleContent>
              {house.owner ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <IconUser className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Nombre</p>
                      <p className="line-clamp-2 text-sm">
                        {`${house.owner.firstName} ${house.owner.lastName}`}
                      </p>
                      <p className="truncate font-mono text-muted-foreground text-xs">{house.owner.id}</p>
                    </div>
                    <CopyButton value={house.owner.id} />
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <IconMail className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Correo</p>
                      <p className="line-clamp-2 text-sm">{house.owner.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <IconPhone className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground text-xs">Teléfono</p>
                      <p className="line-clamp-2 text-sm">{house.owner.phone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Empty className="border border-dashed p-3">
                  <EmptyHeader>
                    <EmptyDescription>No tiene propietario asignado.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter className="block border-t">
          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Fecha de registro</span>
              <span>{formatDate(house.createdAt)}</span>
            </div>
            {house.updatedAt &&
              new Date(house.updatedAt).getTime() !== new Date(house.createdAt).getTime() && (
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Última actualización</span>
                  <span>{formatDate(house.updatedAt)}</span>
                </div>
              )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

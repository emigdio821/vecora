import { CalendarPlusIcon, HistoryIcon, NotebookPenIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { CollapsibleSection, Muted, Timestamp } from '@/components/shared/details'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { HouseQueryData } from '@/tanstack-queries/houses'
import { RELATIONSHIP_LABEL, sortByRelationship } from '../relationship'
import { EditHouseDrawer } from './edit-house'

interface HouseDetailsDrawerProps extends React.ComponentProps<typeof Drawer> {
  house: HouseQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HouseDetailsDrawer({ house, open, onOpenChange, ...props }: HouseDetailsDrawerProps) {
  const canManage = useHasRole('president')
  const [isEditOpen, setEditOpen] = useState(false)
  const residents = sortByRelationship(house.property_residents)

  return (
    <Drawer position="right" open={open} onOpenChange={onOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Casa {house.number}</DrawerTitle>
          <DrawerDescription>Información de la casa</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="grid gap-3">
          <CollapsibleSection icon={<UsersIcon />} title="Residentes" count={residents.length}>
            {residents.length ? (
              <ul className="grid gap-3">
                {residents.map(({ resident, relationship }) => (
                  <li key={resident.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="grid min-w-0 gap-0.5">
                      <span className="truncate font-medium">
                        {resident.first_name} {resident.last_name}
                      </span>
                      <a
                        className="truncate text-xs text-muted-foreground hover:underline"
                        href={`tel:${resident.phone}`}
                      >
                        {resident.phone}
                      </a>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {RELATIONSHIP_LABEL[relationship]}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <Muted>Nadie está asignado a esta casa.</Muted>
            )}
          </CollapsibleSection>

          {house.notes && (
            <CollapsibleSection icon={<NotebookPenIcon />} title="Notas">
              <p className="text-sm whitespace-pre-wrap">{house.notes}</p>
            </CollapsibleSection>
          )}

          <dl className="grid grid-cols-2 gap-3 px-1 pt-1">
            <Timestamp icon={<CalendarPlusIcon />} label="Creada" value={house.created_at} />
            <Timestamp icon={<HistoryIcon />} label="Actualizada" value={house.updated_at} />
          </dl>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>Cerrar</DrawerClose>
          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(true)
                }}
              >
                Editar
              </Button>
              {/* Rendered inside this popup so Base UI treats it as a nested drawer. */}
              <EditHouseDrawer house={house} open={isEditOpen} onOpenChange={setEditOpen} />
            </>
          )}
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

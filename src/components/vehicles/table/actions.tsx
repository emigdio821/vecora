import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { m } from '@/paraglide/messages'
import type { VehicleQueryData } from '@/tanstack-queries/vehicles'
import { DeleteVehiclesAlertDialog } from '../dialog/delete-vehicles'
import { type EditableVehicle, VehicleDrawer } from '../drawer/vehicle-drawer'

interface ActionsProps {
  vehicle: VehicleQueryData
}

function toEditable(vehicle: VehicleQueryData): EditableVehicle {
  let propertyId: string | null = null
  if (vehicle.property) {
    propertyId = vehicle.property.id
  }
  return {
    id: vehicle.id,
    kind: vehicle.kind,
    plate: vehicle.plate,
    rfidSerial: vehicle.rfidSerial,
    propertyId,
  }
}

/** Edit and delete. Only for the registry's managers: the table hides this column from readers. */
export function VehiclesTableActions({ vehicle }: ActionsProps) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <VehicleDrawer vehicle={toEditable(vehicle)} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeleteVehiclesAlertDialog vehicles={[vehicle]} open={isDeleteOpen} onOpenChange={setDeleteOpen} />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={m.residential_actions_for({ name: vehicle.plate })}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-42">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 line-clamp-2 py-0 wrap-break-word">
              {vehicle.plate}
            </MenuGroupLabel>

            <MenuItem
              onClick={() => {
                setEditOpen(true)
              }}
            >
              {m.common_action_edit()}
            </MenuItem>

            <MenuItem
              variant="destructive"
              onClick={() => {
                setDeleteOpen(true)
              }}
            >
              {m.common_action_delete()}
            </MenuItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { m } from '@/paraglide/messages'
import type { HouseQueryData } from '@/tanstack-queries/houses'
import { DeleteHousesAlertDialog } from '../dialog/delete-houses'
import { EditHouseDrawer } from '../drawer/edit-house'
import { HouseDetailsDrawer } from '../drawer/house-details'

interface ActionsProps {
  house: HouseQueryData
}

export function HousesTableActions({ house }: ActionsProps) {
  const canManage = useHasRole('president')
  const [isDetailsOpen, setDetailsOpen] = useState(false)
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const label = m.common_house_label({ number: house.number })

  return (
    <>
      <HouseDetailsDrawer house={house} open={isDetailsOpen} onOpenChange={setDetailsOpen} />
      {canManage && (
        <>
          <EditHouseDrawer house={house} open={isEditOpen} onOpenChange={setEditOpen} />
          <DeleteHousesAlertDialog houses={[house]} open={isDeleteOpen} onOpenChange={setDeleteOpen} />
        </>
      )}

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={m.residential_actions_for({ name: label })}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-42">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 line-clamp-2 py-0 wrap-break-word">{label}</MenuGroupLabel>

            <MenuItem
              onClick={() => {
                setDetailsOpen(true)
              }}
            >
              {m.residential_action_info()}
            </MenuItem>

            {canManage && (
              <>
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
              </>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

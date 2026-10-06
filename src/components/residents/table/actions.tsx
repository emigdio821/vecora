import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { m } from '@/paraglide/messages'
import { type ResidentQueryData } from '@/tanstack-queries/residents'
import { DeleteResidentsAlertDialog } from '../dialog/delete-residents'
import { EditResidentDrawer } from '../drawer/edit-resident'
import { ResidentDetailsDrawer } from '../drawer/resident-details'

interface ActionsProps {
  resident: ResidentQueryData
}

export function ResidentsTableActions({ resident }: ActionsProps) {
  const canManage = useHasRole('president')
  const [isDetailsOpen, setDetailsOpen] = useState(false)
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const residentFullName = `${resident.first_name} ${resident.last_name}`

  return (
    <>
      <ResidentDetailsDrawer resident={resident} open={isDetailsOpen} onOpenChange={setDetailsOpen} />
      {canManage && (
        <>
          <EditResidentDrawer resident={resident} open={isEditOpen} onOpenChange={setEditOpen} />
          <DeleteResidentsAlertDialog
            residents={[resident]}
            open={isDeleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={m.residential_actions_for({ name: residentFullName })}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-42">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 line-clamp-2 py-0 wrap-break-word">
              {residentFullName}
            </MenuGroupLabel>

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

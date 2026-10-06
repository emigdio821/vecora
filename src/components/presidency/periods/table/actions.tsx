import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { m } from '@/paraglide/messages'
import { type PeriodQueryData, transactionCount } from '@/tanstack-queries/treasury'
import { DeletePeriodAlertDialog } from '../dialog/delete-period'
import { EditPeriodDrawer } from '../drawer/edit-period'

interface ActionsProps {
  period: PeriodQueryData
}

export function PeriodsTableActions({ period }: ActionsProps) {
  const canManage = useHasRole('treasurer', 'president')
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // Soft-deleted movements count too: the ledger is never purged.
  const canDelete = transactionCount(period) === 0

  // Every item here writes, so readers see no menu.
  if (!canManage) return null

  return (
    <>
      <EditPeriodDrawer period={period} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeletePeriodAlertDialog period={period} open={isDeleteOpen} onOpenChange={setDeleteOpen} />

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={m.presidency_actions_for({ name: period.name })}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-42">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 py-0">{period.name}</MenuGroupLabel>

            <MenuItem
              onClick={() => {
                setEditOpen(true)
              }}
            >
              {m.common_action_edit()}
            </MenuItem>

            {canDelete && (
              <MenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteOpen(true)
                }}
              >
                {m.common_action_delete()}
              </MenuItem>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

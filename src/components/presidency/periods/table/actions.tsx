'use client'

import { EllipsisIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { type PeriodQueryData, transactionCount } from '@/tanstack-queries/treasury'
import { DeletePeriodAlertDialog } from '../dialog/delete-period'
import { EditPeriodDrawer } from '../drawer/edit-period'

interface ActionsProps {
  period: PeriodQueryData
}

export function PeriodsTableActions({ period }: ActionsProps) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  // Soft-deleted movements count too: the ledger is never purged.
  const canDelete = transactionCount(period) === 0

  return (
    <>
      <EditPeriodDrawer period={period} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeletePeriodAlertDialog period={period} open={isDeleteOpen} onOpenChange={setDeleteOpen} />

      <Menu>
        <MenuTrigger
          render={
            <Button size="icon" variant="ghost" className="ml-auto" aria-label={`Acciones de ${period.name}`}>
              <EllipsisIcon className="size-4" />
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
              Editar
            </MenuItem>

            {canDelete && (
              <MenuItem
                variant="destructive"
                onClick={() => {
                  setDeleteOpen(true)
                }}
              >
                Eliminar
              </MenuItem>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

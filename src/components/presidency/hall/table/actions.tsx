'use client'

import { EllipsisIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { formatDay } from '@/lib/utils'
import type { HallReservationQueryData } from '@/tanstack-queries/presidency'
import { DeleteHallReservationAlertDialog } from '../dialog/delete-hall-reservation'
import { EditHallReservationDrawer } from '../drawer/edit-hall-reservation'

interface ActionsProps {
  reservation: HallReservationQueryData
}

export function HallReservationsTableActions({ reservation }: ActionsProps) {
  const [isEditOpen, setEditOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const summary = `${formatDay(reservation.reserved_on)} · Casa ${reservation.property.number}`

  return (
    <>
      <EditHallReservationDrawer reservation={reservation} open={isEditOpen} onOpenChange={setEditOpen} />
      <DeleteHallReservationAlertDialog
        reservation={reservation}
        open={isDeleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <Menu>
        <MenuTrigger
          render={
            <Button size="icon" variant="ghost" className="ml-auto" aria-label={`Acciones de ${summary}`}>
              <EllipsisIcon className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-48">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 py-0">{summary}</MenuGroupLabel>

            <MenuItem
              onClick={() => {
                setEditOpen(true)
              }}
            >
              Editar
            </MenuItem>

            <MenuItem
              variant="destructive"
              onClick={() => {
                setDeleteOpen(true)
              }}
            >
              Cancelar reservación
            </MenuItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

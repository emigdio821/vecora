import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import { formatDay } from '@/lib/utils'
import type { HallReservationQueryData } from '@/tanstack-queries/presidency'
import { DeleteHallReservationAlertDialog } from '../dialog/delete-hall-reservation'
import { CancelHallReservationDrawer } from '../drawer/cancel-hall-reservation'
import { EditHallReservationDrawer } from '../drawer/edit-hall-reservation'
import { PayHallReservationDrawer } from '../drawer/pay-hall-reservation'
import { hallReservationStatus } from '../status'

interface ActionsProps {
  reservation: HallReservationQueryData
}

export function HallReservationsTableActions({ reservation }: ActionsProps) {
  const canManage = useHasRole('president', 'treasurer')
  const isTreasurer = useHasRole('treasurer')
  const [isEditOpen, setEditOpen] = useState(false)
  const [isPayOpen, setPayOpen] = useState(false)
  const [isCancelOpen, setCancelOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const summary = `${formatDay(reservation.reserved_on)} - Casa ${reservation.property.number}`
  const status = hallReservationStatus(reservation)

  // Every item here writes, so readers see no menu. A cancelled booking is
  // history: the DB rejects any further change to it.
  if (!canManage || status === 'cancelled') return null

  // Unpaid bookings are simply removed; paid ones need the treasurer to
  // settle the refund, so the president can't cancel them.
  const canCancel = status !== 'paid' || isTreasurer

  return (
    <>
      <EditHallReservationDrawer reservation={reservation} open={isEditOpen} onOpenChange={setEditOpen} />
      {isTreasurer && status === 'pending' && (
        <PayHallReservationDrawer reservation={reservation} open={isPayOpen} onOpenChange={setPayOpen} />
      )}
      {isTreasurer && status === 'paid' && (
        <CancelHallReservationDrawer
          reservation={reservation}
          open={isCancelOpen}
          onOpenChange={setCancelOpen}
        />
      )}
      {status !== 'paid' && (
        <DeleteHallReservationAlertDialog
          reservation={reservation}
          open={isDeleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}

      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className="ms-auto flex"
              aria-label={`Acciones de ${summary}`}
            >
              <IconDots className="size-4" />
            </Button>
          }
        />
        <MenuPopup align="end" className="max-w-48">
          <MenuGroup>
            <MenuGroupLabel className="my-1.5 py-0">{summary}</MenuGroupLabel>

            {isTreasurer && status === 'pending' && (
              <MenuItem
                onClick={() => {
                  setPayOpen(true)
                }}
              >
                Registrar pago
              </MenuItem>
            )}

            <MenuItem
              onClick={() => {
                setEditOpen(true)
              }}
            >
              Editar
            </MenuItem>

            {canCancel && (
              <MenuItem
                variant="destructive"
                onClick={() => {
                  if (status === 'paid') {
                    setCancelOpen(true)
                  } else {
                    setDeleteOpen(true)
                  }
                }}
              >
                Cancelar reservación
              </MenuItem>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
    </>
  )
}

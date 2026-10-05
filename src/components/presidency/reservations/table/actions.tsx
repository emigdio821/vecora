import { IconDots } from '@tabler/icons-react'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { Button } from '@/components/ui/button'
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'
import type { ReservationQueryData } from '@/tanstack-queries/presidency'
import { DeleteReservationAlertDialog } from '../dialog/delete-reservation'
import { CancelReservationDrawer } from '../drawer/cancel-reservation'
import { EditReservationDrawer } from '../drawer/edit-reservation'
import { PayReservationDrawer } from '../drawer/pay-reservation'
import { reservationStatus, reservationSummary } from '../status'

interface ActionsProps {
  reservation: ReservationQueryData
}

export function ReservationsTableActions({ reservation }: ActionsProps) {
  const canManage = useHasRole('president', 'treasurer')
  const isTreasurer = useHasRole('treasurer')
  const [isEditOpen, setEditOpen] = useState(false)
  const [isPayOpen, setPayOpen] = useState(false)
  const [isCancelOpen, setCancelOpen] = useState(false)
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const summary = reservationSummary(reservation)
  const status = reservationStatus(reservation)

  // Every item here writes, so readers see no menu. A cancelled booking is
  // history: the DB rejects any further change to it.
  if (!canManage || status === 'cancelled') return null

  // Unpaid bookings are simply removed; paid ones need the treasurer to
  // settle the refund, so the president can't cancel them.
  const canCancel = status !== 'paid' || isTreasurer

  return (
    <>
      <EditReservationDrawer reservation={reservation} open={isEditOpen} onOpenChange={setEditOpen} />
      {isTreasurer && status === 'pending' && (
        <PayReservationDrawer reservation={reservation} open={isPayOpen} onOpenChange={setPayOpen} />
      )}
      {isTreasurer && status === 'paid' && (
        <CancelReservationDrawer reservation={reservation} open={isCancelOpen} onOpenChange={setCancelOpen} />
      )}
      {status !== 'paid' && (
        <DeleteReservationAlertDialog
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

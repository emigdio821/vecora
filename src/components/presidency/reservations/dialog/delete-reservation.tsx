import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AlertDialogPrimitive } from '@/components/ui/alert-dialog'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { deleteReservation } from '@/server-actions/presidency'
import { PRESIDENCY_QUERY_KEY, type ReservationQueryData } from '@/tanstack-queries/presidency'
import { reservationSummary } from '../status'

interface DeleteReservationAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  reservation: ReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteReservationAlertDialog({
  reservation,
  open,
  onOpenChange,
  ...props
}: DeleteReservationAlertDialogProps) {
  const queryClient = useQueryClient()
  const summary = reservationSummary(reservation)

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await deleteReservation(reservation.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: 'Reservación cancelada', description: summary })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo cancelar', description: error.message })
    },
  })

  const handleOpenChange: AlertDialogPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange} {...props}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar esta reservación?</AlertDialogTitle>
          <AlertDialogDescription>
            {summary}. El día quedará libre para otra casa. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Volver
          </AlertDialogClose>
          <Button
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => {
              mutation.mutate()
            }}
          >
            Cancelar reservación
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

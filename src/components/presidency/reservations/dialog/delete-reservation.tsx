import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogClose,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogPopup,
  type ResponsiveAlertDialogProps,
  ResponsiveAlertDialogTitle,
} from '@/components/shared/responsive-alert-dialog'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'
import { deleteReservation } from '@/server-actions/presidency'
import { PRESIDENCY_QUERY_KEY, type ReservationQueryData } from '@/tanstack-queries/presidency'
import { reservationSummary } from '../status'

interface DeleteReservationAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  reservation: ReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteReservationAlertDialog({
  reservation,
  open,
  onOpenChange,
  onOpenChangeComplete,
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
      toastManager.add({ type: 'success', title: m.presidency_reservation_cancelled(), description: summary })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.presidency_cancel_failed(), description: error.message })
    },
  })

  const handleOpenChange = (nextOpen: boolean, eventDetails: { cancel: () => void }) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  // Still busy after a delete, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <ResponsiveAlertDialog
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the buttons busy while the dialog closes.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <ResponsiveAlertDialogPopup>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>{m.presidency_delete_reservation_title()}</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {m.presidency_delete_reservation_description({ summary })}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>

        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.presidency_go_back()}
          </ResponsiveAlertDialogClose>
          <Button
            variant="destructive"
            loading={isBusy}
            onClick={() => {
              mutation.mutate()
            }}
          >
            {m.presidency_cancel_reservation()}
          </Button>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

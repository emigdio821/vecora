import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Money } from '@/components/shared/money'
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
import { reopenMaintenanceRequest } from '@/server-actions/maintenance'
import { MAINTENANCE_QUERY_KEY, type MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'

interface ReopenRequestAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  request: MaintenanceRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Treasurer: takes back a rejection so the same request can be fixed and paid. */
export function ReopenRequestAlertDialog({
  request,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: ReopenRequestAlertDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await reopenMaintenanceRequest(request.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [MAINTENANCE_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.requests_reopen_success(), description: request.title })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.requests_reopen_failed(), description: error.message })
    },
  })

  const handleOpenChange = (nextOpen: boolean, eventDetails: { cancel: () => void }) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  // Still busy after a reopen, until the dialog has closed and reset the mutation.
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
          <ResponsiveAlertDialogTitle>{m.requests_reopen_title()}</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {request.title} - <Money value={request.amount} currency={request.currency} />.{' '}
            {m.requests_reopen_description()}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>

        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </ResponsiveAlertDialogClose>
          <Button
            loading={isBusy}
            onClick={() => {
              mutation.mutate()
            }}
          >
            {m.requests_action_reopen()}
          </Button>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

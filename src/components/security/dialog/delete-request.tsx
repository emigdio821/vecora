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
import { deleteSecurityRequest } from '@/server-actions/security'
import { SECURITY_QUERY_KEY, type SecurityRequestQueryData } from '@/tanstack-queries/security'

interface DeleteRequestAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  request: SecurityRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Pending requests only; resolved ones are history and stay. */
export function DeleteRequestAlertDialog({
  request,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: DeleteRequestAlertDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await deleteSecurityRequest(request.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SECURITY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.requests_delete_success(), description: request.title })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_delete_failed(), description: error.message })
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
          <ResponsiveAlertDialogTitle>{m.requests_delete_title()}</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {request.title} - <Money value={request.amount} currency={request.currency} />.{' '}
            {m.requests_delete_description()}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>

        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </ResponsiveAlertDialogClose>
          <Button
            variant="destructive"
            loading={isBusy}
            onClick={() => {
              mutation.mutate()
            }}
          >
            {m.common_action_delete()}
          </Button>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

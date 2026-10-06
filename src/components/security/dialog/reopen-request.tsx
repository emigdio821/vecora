import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Money } from '@/components/shared/money'
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
import { m } from '@/paraglide/messages'
import { reopenSecurityRequest } from '@/server-actions/security'
import { SECURITY_QUERY_KEY, type SecurityRequestQueryData } from '@/tanstack-queries/security'

interface ReopenRequestAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  request: SecurityRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Treasurer: takes back a rejection so the same request can be fixed and paid. */
export function ReopenRequestAlertDialog({
  request,
  open,
  onOpenChange,
  ...props
}: ReopenRequestAlertDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await reopenSecurityRequest(request.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SECURITY_QUERY_KEY] })
      toastManager.add({ type: 'success', title: m.requests_reopen_success(), description: request.title })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.requests_reopen_failed(), description: error.message })
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
          <AlertDialogTitle>{m.requests_reopen_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {request.title} - <Money value={request.amount} currency={request.currency} />.{' '}
            {m.requests_reopen_description()}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            {m.common_action_cancel()}
          </AlertDialogClose>
          <Button
            loading={mutation.isPending}
            onClick={() => {
              mutation.mutate()
            }}
          >
            {m.requests_action_reopen()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

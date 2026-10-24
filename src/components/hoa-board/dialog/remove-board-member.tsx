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
import { removeBoardMember } from '@/server-actions/hoa-board'
import { type BoardMemberQueryData, HOA_BOARD_QUERY_KEY } from '@/tanstack-queries/hoa-board'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'

interface RemoveBoardMemberAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  member: BoardMemberQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Revokes every role: the person leaves the board and can no longer sign in. */
export function RemoveBoardMemberAlertDialog({
  member,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: RemoveBoardMemberAlertDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await removeBoardMember(member.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [HOA_BOARD_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.board_member_removed(),
        description: m.board_member_removed_description({ name: member.name }),
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.board_remove_failed(), description: error.message })
    },
  })

  const handleOpenChange = (nextOpen: boolean, eventDetails: { cancel: () => void }) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  // Still busy after a removal, until the dialog has closed and reset the mutation.
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
          <ResponsiveAlertDialogTitle>
            {m.board_remove_title({ name: member.name })}
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>{m.board_remove_description()}</ResponsiveAlertDialogDescription>
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
            {m.board_remove_confirm()}
          </Button>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

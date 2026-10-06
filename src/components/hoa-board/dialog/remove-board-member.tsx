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
import { m } from '@/paraglide/messages'
import { removeBoardMember } from '@/server-actions/hoa-board'
import { type BoardMemberQueryData, HOA_BOARD_QUERY_KEY } from '@/tanstack-queries/hoa-board'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'

interface RemoveBoardMemberAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  member: BoardMemberQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Revokes every role: the person leaves the board and can no longer sign in. */
export function RemoveBoardMemberAlertDialog({
  member,
  open,
  onOpenChange,
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
        description: m.board_member_removed_description({ name: member.full_name }),
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.board_remove_failed(), description: error.message })
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
          <AlertDialogTitle>{m.board_remove_title({ name: member.full_name })}</AlertDialogTitle>
          <AlertDialogDescription>{m.board_remove_description()}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            {m.common_action_cancel()}
          </AlertDialogClose>
          <Button
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => {
              mutation.mutate()
            }}
          >
            {m.board_remove_confirm()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

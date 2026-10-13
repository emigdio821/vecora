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
import { deleteCategory } from '@/server-actions/treasury'
import { type CategoryQueryData, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'

interface DeleteCategoryAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  category: CategoryQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Hard delete. Only offered for categories without movements (see actions.tsx). */
export function DeleteCategoryAlertDialog({
  category,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: DeleteCategoryAlertDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await deleteCategory(category.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY, 'categories'] })
      toastManager.add({ type: 'success', title: m.treasury_category_deleted(), description: category.name })
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
          <ResponsiveAlertDialogTitle>
            {m.treasury_delete_category_title({ name: category.name })}
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {m.treasury_delete_category_description()}
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

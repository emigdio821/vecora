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
import { deleteCategory } from '@/server-actions/treasury'
import { type CategoryQueryData, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'

interface DeleteCategoryAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  category: CategoryQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Hard delete. Only offered for categories without movements (see actions.tsx). */
export function DeleteCategoryAlertDialog({
  category,
  open,
  onOpenChange,
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
          <AlertDialogTitle>{m.treasury_delete_category_title({ name: category.name })}</AlertDialogTitle>
          <AlertDialogDescription>{m.treasury_delete_category_description()}</AlertDialogDescription>
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
            {m.common_action_delete()}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

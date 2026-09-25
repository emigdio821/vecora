'use client'

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
      toastManager.add({ type: 'success', title: 'Categoría eliminada', description: category.name })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo eliminar', description: error.message })
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
          <AlertDialogTitle>¿Eliminar la categoría "{category.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            No tiene movimientos registrados, así que se eliminará por completo. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </AlertDialogClose>
          <Button variant="destructive" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

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
import { formatCurrency } from '@/lib/utils'
import { deleteSecurityRequest } from '@/server-actions/security'
import { SECURITY_QUERY_KEY, type SecurityRequestQueryData } from '@/tanstack-queries/security'

interface DeleteRequestAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  request: SecurityRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Pending requests only; resolved ones are history and stay. */
export function DeleteRequestAlertDialog({
  request,
  open,
  onOpenChange,
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
      toastManager.add({ type: 'success', title: 'Solicitud eliminada', description: request.title })
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
          <AlertDialogTitle>¿Eliminar esta solicitud?</AlertDialogTitle>
          <AlertDialogDescription>
            {request.title} - {formatCurrency(Number(request.amount))}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </AlertDialogClose>
          <Button
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => {
              mutation.mutate()
            }}
          >
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

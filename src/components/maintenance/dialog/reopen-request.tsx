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
import { reopenMaintenanceRequest } from '@/server-actions/maintenance'
import { MAINTENANCE_QUERY_KEY, type MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'

interface ReopenRequestAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  request: MaintenanceRequestQueryData
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
      const result = await reopenMaintenanceRequest(request.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [MAINTENANCE_QUERY_KEY] })
      toastManager.add({ type: 'success', title: 'Solicitud reabierta', description: request.title })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo reabrir', description: error.message })
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
          <AlertDialogTitle>¿Reabrir esta solicitud?</AlertDialogTitle>
          <AlertDialogDescription>
            {request.title} - {formatCurrency(Number(request.amount))}. Volverá a quedar pendiente: se podrá
            editar, pagar o rechazar de nuevo, y se quitará el motivo del rechazo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </AlertDialogClose>
          <Button
            loading={mutation.isPending}
            onClick={() => {
              mutation.mutate()
            }}
          >
            Reabrir
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

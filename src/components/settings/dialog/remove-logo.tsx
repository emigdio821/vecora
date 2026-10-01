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
import { removeLogo } from '@/server-actions/settings'
import { SETTINGS_QUERY_KEY } from '@/tanstack-queries/settings'

interface RemoveLogoAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Opened from "Ajustes"; the file is deleted, so it has to be uploaded again to get it back. */
export function RemoveLogoAlertDialog({ open, onOpenChange, ...props }: RemoveLogoAlertDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await removeLogo()
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] })
      toastManager.add({ type: 'success', title: 'Logo eliminado' })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo quitar', description: error.message })
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
          <AlertDialogTitle>¿Quitar el logo?</AlertDialogTitle>
          <AlertDialogDescription>
            Los reportes se generarán solo con el nombre del residencial. Para volver a usarlo tendrás que
            subirlo de nuevo.
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
            Quitar
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

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
        title: 'Integrante retirado',
        description: `${member.full_name} ya no puede entrar a Vecora`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo retirar', description: error.message })
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
          <AlertDialogTitle>¿Retirar a {member.full_name} de la mesa directiva?</AlertDialogTitle>
          <AlertDialogDescription>
            Perderá todos sus roles y ya no podrá entrar a la aplicación. Sus registros anteriores
            (movimientos, reservaciones) se conservan. Podrás volver a agregarle después.
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
            Retirar
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

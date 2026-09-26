'use client'

import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { deleteHouses, restoreHouses } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'

/** How long the "Deshacer" toast stays up. Rows are recoverable for 6 months
 *  either way; this only bounds the one-click shortcut. */
const UNDO_TOAST_TIMEOUT_MS = 8000

/**
 * Standalone (not a hook): by the time the user clicks "Deshacer" the row —
 * and the menu/dialog that started the delete — is usually unmounted.
 */
async function undoDelete(queryClient: QueryClient, ids: string[]) {
  const result = await restoreHouses(ids)

  if (result.error !== undefined) {
    toastManager.add({ type: 'error', title: 'No se pudo deshacer', description: result.error })
    return
  }

  // Residents list their houses, so they change too.
  void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
  void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
  toastManager.add({
    type: 'success',
    title: result.data.restored === 1 ? 'Casa restaurada' : 'Casas restauradas',
  })
}

interface DeleteHousesAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  /** One house from a row menu, or many from the table selection. */
  houses: HouseQueryData[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful delete, e.g. to clear the table selection. */
  onDeleted?: () => void
}

export function DeleteHousesAlertDialog({
  houses,
  open,
  onOpenChange,
  onDeleted,
  ...props
}: DeleteHousesAlertDialogProps) {
  const queryClient = useQueryClient()
  const count = houses.length
  const isSingle = count === 1
  const singleLabel = isSingle ? `la casa ${houses[0].number}` : null
  const residentCount = new Set(houses.flatMap((h) => h.property_residents.map((pr) => pr.resident.id))).size
  const residentsClause =
    residentCount === 0
      ? `${isSingle ? 'Dejará' : 'Dejarán'} de aparecer en el listado de casas.`
      : `${residentCount === 1 ? 'Su residente seguirá' : `Sus ${residentCount} residentes seguirán`} en el directorio, pero ya no ${residentCount === 1 ? 'aparecerá asignado' : 'aparecerán asignados'} a ${isSingle ? 'esta casa' : 'estas casas'}.`
  const description = `${residentsClause} Solo podrás deshacerlo durante unos segundos.`

  const mutation = useMutation({
    mutationFn: async () => {
      const ids = houses.map((h) => h.id)
      const result = await deleteHouses(ids)
      if (result.error !== undefined) throw new Error(result.error)
      return { ...result.data, ids }
    },
    onSuccess: ({ deleted, ids }) => {
      // Residents list their houses, so they change too.
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })

      const partial = deleted < count // RLS filtered some rows out
      const toastId = toastManager.add({
        type: partial ? 'warning' : 'success',
        title: partial ? 'Eliminación parcial' : isSingle ? 'Casa eliminada' : 'Casas eliminadas',
        description: partial
          ? `Se eliminaron ${deleted} de ${count} casas`
          : isSingle
            ? `Se eliminó ${singleLabel}`
            : `Se eliminaron ${deleted} casas`,
        timeout: UNDO_TOAST_TIMEOUT_MS,
        actionProps: {
          children: 'Deshacer',
          onClick: () => {
            toastManager.close(toastId)
            void undoDelete(queryClient, ids)
          },
        },
      })

      onDeleted?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({
        type: 'error',
        title: 'No se pudo eliminar',
        description: error.message,
      })
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
          <AlertDialogTitle>
            {isSingle ? `¿Eliminar ${singleLabel}?` : `¿Eliminar ${count} casas?`}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {!isSingle && (
          <ul className="max-h-48 overflow-y-auto px-6 pb-4 text-sm">
            {houses.map((house) => (
              <li key={house.id} className="truncate">
                Casa {house.number}
              </li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </AlertDialogClose>
          <Button
            variant="destructive"
            loading={mutation.isPending}
            disabled={count === 0}
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

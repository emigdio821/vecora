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
import { deleteResidents, restoreResidents } from '@/server-actions/residents'
import { HOUSES_QUERY_KEY } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY, type ResidentQueryData } from '@/tanstack-queries/residents'

/** How long the "Deshacer" toast stays up. Rows are recoverable for 6 months
 *  either way; this only bounds the one-click shortcut. */
const UNDO_TOAST_TIMEOUT_MS = 8000

/**
 * Standalone (not a hook): by the time the user clicks "Deshacer" the row —
 * and the menu/dialog that started the delete — is usually unmounted.
 */
async function undoDelete(queryClient: QueryClient, ids: string[]) {
  const result = await restoreResidents(ids)

  if (result.error !== undefined) {
    toastManager.add({ type: 'error', title: 'No se pudo deshacer', description: result.error })
    return
  }

  // Houses list their residents, so they change too.
  void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
  void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
  toastManager.add({
    type: 'success',
    title: result.data.restored === 1 ? 'Residente restaurado' : 'Residentes restaurados',
  })
}

interface DeleteResidentsAlertDialogProps extends React.ComponentProps<typeof AlertDialog> {
  /** One resident from a row menu, or many from the table selection. */
  residents: ResidentQueryData[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful delete, e.g. to clear the table selection. */
  onDeleted?: () => void
}

export function DeleteResidentsAlertDialog({
  residents,
  open,
  onOpenChange,
  onDeleted,
  ...props
}: DeleteResidentsAlertDialogProps) {
  const queryClient = useQueryClient()
  const count = residents.length
  const isSingle = count === 1
  const singleName = isSingle ? `${residents[0].first_name} ${residents[0].last_name}` : null
  const houseCount = new Set(residents.flatMap((r) => r.property_residents.map((pr) => pr.property.id))).size
  const housesClause =
    houseCount > 0
      ? ` y en ${houseCount === 1 ? 'la casa' : `las ${houseCount} casas`} donde ${isSingle ? 'está asignado' : 'están asignados'}`
      : ''
  const description = `${isSingle ? 'Dejará' : 'Dejarán'} de aparecer en el directorio${housesClause}. Solo podrás deshacerlo durante unos segundos.`

  const mutation = useMutation({
    mutationFn: async () => {
      const ids = residents.map((r) => r.id)
      const result = await deleteResidents(ids)
      // `!== undefined` (not truthiness) so TS narrows `data` in the happy path.
      if (result.error !== undefined) throw new Error(result.error)
      return { ...result.data, ids }
    },
    onSuccess: ({ deleted, ids }) => {
      // Houses list their residents, so they change too.
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })

      const partial = deleted < count // RLS filtered some rows out
      const toastId = toastManager.add({
        type: partial ? 'warning' : 'success',
        title: partial ? 'Eliminación parcial' : isSingle ? 'Residente eliminado' : 'Residentes eliminados',
        description: partial
          ? `Se eliminaron ${deleted} de ${count} residentes`
          : isSingle
            ? `${singleName} fue eliminado`
            : `Se eliminaron ${deleted} residentes`,
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
            {isSingle ? `¿Eliminar a ${singleName}?` : `¿Eliminar ${count} residentes?`}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {!isSingle && (
          <ul className="max-h-48 scroll-fade overflow-y-auto px-6 pb-4 text-sm">
            {residents.map((resident) => (
              <li key={resident.id} className="truncate">
                {resident.first_name} {resident.last_name}
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
            onClick={() => mutation.mutate()}
          >
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

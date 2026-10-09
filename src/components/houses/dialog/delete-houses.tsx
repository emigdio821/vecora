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
import { m } from '@/paraglide/messages'
import { deleteHouses, restoreHouses } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'

/** How long the undo toast stays up. Rows are recoverable for 6 months
 *  either way; this only bounds the one-click shortcut. */
const UNDO_TOAST_TIMEOUT_MS = 8000

/**
 * Standalone (not a hook): by the time the user clicks Undo the row —
 * and the menu/dialog that started the delete — is usually unmounted.
 */
async function undoDelete(queryClient: QueryClient, ids: string[]) {
  const result = await restoreHouses(ids)

  if (result.error !== undefined) {
    toastManager.add({ type: 'error', title: m.common_undo_failed(), description: result.error })
    return
  }

  // Residents list their houses, so they change too.
  void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
  void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
  toastManager.add({
    type: 'success',
    title: result.data.restored === 1 ? m.residential_house_restored() : m.residential_houses_restored(),
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
  onOpenChangeComplete,
  ...props
}: DeleteHousesAlertDialogProps) {
  const queryClient = useQueryClient()
  const count = houses.length
  const isSingle = count === 1
  const singleNumber = isSingle ? houses[0].number : ''
  const residentCount = new Set(houses.flatMap((h) => h.property_residents.map((pr) => pr.resident.id))).size
  const residentsClause =
    residentCount === 0
      ? isSingle
        ? m.residential_delete_house_no_residents()
        : m.residential_delete_houses_no_residents()
      : isSingle
        ? m.residential_delete_house_residents({ count: residentCount })
        : m.residential_delete_houses_residents({ count: residentCount })
  const description = `${residentsClause} ${m.residential_undo_window()}`

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
        title: partial
          ? m.common_partial_delete()
          : isSingle
            ? m.residential_house_deleted()
            : m.residential_houses_deleted(),
        description: partial
          ? m.residential_houses_deleted_partial({ deleted, count })
          : isSingle
            ? m.residential_house_deleted_description({ number: singleNumber })
            : m.residential_houses_deleted_description({ count: deleted }),
        timeout: UNDO_TOAST_TIMEOUT_MS,
        actionProps: {
          children: m.common_action_undo(),
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
        title: m.common_delete_failed(),
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

  // Still busy after a delete, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <AlertDialog
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
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSingle
              ? m.residential_delete_house_title({ number: singleNumber })
              : m.residential_delete_houses_title({ count })}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {!isSingle && (
          <ul className="max-h-48 overflow-y-auto px-6 pb-4 text-sm">
            {houses.map((house) => (
              <li key={house.id} className="truncate">
                {house.number}
              </li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </AlertDialogClose>
          <Button
            variant="destructive"
            loading={isBusy}
            disabled={count === 0}
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

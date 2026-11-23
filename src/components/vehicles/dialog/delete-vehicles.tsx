import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogClose,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogPanel,
  ResponsiveAlertDialogPopup,
  type ResponsiveAlertDialogProps,
  ResponsiveAlertDialogTitle,
} from '@/components/shared/responsive-alert-dialog'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { m } from '@/paraglide/messages'
import { deleteVehicles, restoreVehicles } from '@/server-actions/vehicles'
import { HOUSES_QUERY_KEY } from '@/tanstack-queries/houses'
import { VEHICLES_QUERY_KEY, type VehicleQueryData } from '@/tanstack-queries/vehicles'

/** How long the undo toast stays up. Rows are recoverable for 6 months
 *  either way; this only bounds the one-click shortcut. */
const UNDO_TOAST_TIMEOUT_MS = 8000

/**
 * Standalone (not a hook): by the time the user clicks Undo the row —
 * and the menu/dialog that started the delete — is usually unmounted.
 */
async function undoDelete(queryClient: QueryClient, ids: string[]) {
  const result = await restoreVehicles(ids)

  if (result.error !== undefined) {
    toastManager.add({ type: 'error', title: m.common_undo_failed(), description: result.error })
    return
  }

  // Houses list their vehicles, so they change too.
  void queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
  void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
  let title = m.residential_vehicles_restored()
  if (result.data.restored === 1) {
    title = m.residential_vehicle_restored()
  }
  toastManager.add({ type: 'success', title })
}

interface DeleteVehiclesAlertDialogProps extends Omit<ResponsiveAlertDialogProps, 'children'> {
  /** One vehicle from a row menu, or many from the table selection. */
  vehicles: VehicleQueryData[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful delete, e.g. to clear the table selection. */
  onDeleted?: () => void
}

export function DeleteVehiclesAlertDialog({
  vehicles,
  open,
  onOpenChange,
  onDeleted,
  onOpenChangeComplete,
  ...props
}: DeleteVehiclesAlertDialogProps) {
  const queryClient = useQueryClient()
  const count = vehicles.length
  const isSingle = count === 1
  const singlePlate = isSingle ? vehicles[0].plate : ''

  let title = m.residential_delete_vehicles_title({ count })
  let description = m.residential_delete_vehicles_description()
  if (isSingle) {
    title = m.residential_delete_vehicle_title({ plate: singlePlate })
    description = m.residential_delete_vehicle_description()
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const ids = vehicles.map((vehicle) => vehicle.id)
      const result = await deleteVehicles(ids)
      // `!== undefined` (not truthiness) so TS narrows `data` in the happy path.
      if (result.error !== undefined) throw new Error(result.error)
      return { ...result.data, ids }
    },
    onSuccess: ({ deleted, ids }) => {
      // Houses list their vehicles, so they change too.
      void queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })

      // Some were already deleted, by someone else meanwhile.
      const partial = deleted < count
      let toastTitle = m.residential_vehicles_deleted()
      let toastDescription = m.residential_vehicles_deleted_description({ count: deleted })
      if (partial) {
        toastTitle = m.common_partial_delete()
        toastDescription = m.residential_vehicles_deleted_partial({ deleted, count })
      } else if (isSingle) {
        toastTitle = m.residential_vehicle_deleted()
        toastDescription = m.residential_vehicle_deleted_description({ plate: singlePlate })
      }

      const toastId = toastManager.add({
        type: partial ? 'warning' : 'success',
        title: toastTitle,
        description: toastDescription,
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
          <ResponsiveAlertDialogTitle>{title}</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            {description} {m.residential_undo_window()}
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>

        {!isSingle && (
          <ResponsiveAlertDialogPanel className="max-h-56 text-sm">
            <ul>
              {vehicles.map((vehicle) => (
                <li key={vehicle.id} className="truncate">
                  {vehicle.plate}
                </li>
              ))}
            </ul>
          </ResponsiveAlertDialogPanel>
        )}

        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </ResponsiveAlertDialogClose>
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
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogPopup>
    </ResponsiveAlertDialog>
  )
}

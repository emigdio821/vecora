import { IconCar, IconUnlink } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CollapsibleSection, Muted } from '@/components/shared/details'
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogClose,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogPopup,
  ResponsiveAlertDialogTitle,
} from '@/components/shared/responsive-alert-dialog'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
import { VEHICLE_KIND_ICON, VEHICLE_KIND_LABEL } from '@/components/vehicles/vehicle'
import { m } from '@/paraglide/messages'
import { unassignVehicle } from '@/server-actions/vehicles'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { VEHICLES_QUERY_KEY } from '@/tanstack-queries/vehicles'
import { AssignVehiclesDrawer } from './assign-vehicles'

type HouseVehicle = HouseQueryData['vehicles'][number]

interface HouseVehiclesProps {
  house: HouseQueryData
  /** Blocks assign/unassign, e.g. while the parent form is saving. */
  disabled?: boolean
}

/**
 * Editable list of a house's vehicles, like its residents: take one off
 * inline, assign registered ones via a nested drawer. Each change saves on
 * its own; the vehicle itself is edited in the Vehicles tab.
 */
export function HouseVehicles({ house, disabled }: HouseVehiclesProps) {
  const [isAssignOpen, setAssignOpen] = useState(false)

  return (
    <CollapsibleSection icon={<IconCar />} title={m.residential_vehicles()} count={house.vehicles.length}>
      {house.vehicles.length ? (
        <ul className="grid gap-3">
          {house.vehicles.map((vehicle) => (
            <li key={vehicle.id} className="flex items-center justify-between gap-2 text-sm">
              <VehicleSummary vehicle={vehicle} />
              <UnassignVehicleButton house={house} vehicle={vehicle} disabled={disabled} />
            </li>
          ))}
        </ul>
      ) : (
        <Muted>{m.residential_house_no_vehicles()}</Muted>
      )}

      {/* Only vehicles already registered: new ones are added in the Vehicles tab. */}
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setAssignOpen(true)
        }}
      >
        {m.residential_assign_vehicles()}
      </Button>

      {/* Rendered inside the parent popup so Base UI treats it as a nested drawer. */}
      <AssignVehiclesDrawer house={house} open={isAssignOpen} onOpenChange={setAssignOpen} />
    </CollapsibleSection>
  )
}

/** The plate with its type icon, and the RFID serial below. Shared with the read-only details. */
export function VehicleSummary({ vehicle }: { vehicle: HouseVehicle }) {
  const Icon = VEHICLE_KIND_ICON[vehicle.kind]

  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-label={VEHICLE_KIND_LABEL[vehicle.kind]}
      />
      <div className="grid min-w-0 gap-0.5">
        <span className="truncate font-medium">{vehicle.plate}</span>
        <span className="truncate text-xs text-muted-foreground">
          {vehicle.rfidSerial
            ? m.residential_rfid_value({ serial: vehicle.rfidSerial })
            : m.residential_no_rfid()}
        </span>
      </div>
    </div>
  )
}

function UnassignVehicleButton({
  house,
  vehicle,
  disabled,
}: {
  house: HouseQueryData
  vehicle: HouseVehicle
  disabled?: boolean
}) {
  const queryClient = useQueryClient()
  const [isConfirmOpen, setConfirmOpen] = useState(false)
  const { plate } = vehicle

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await unassignVehicle(vehicle.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      // Both sides show it: the house's vehicles and each vehicle's house.
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [VEHICLES_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.residential_vehicle_removed(),
        description: m.residential_vehicle_removed_description({ plate, number: house.number }),
      })
      setConfirmOpen(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_remove_failed(), description: error.message })
    },
  })

  const handleOpenChange = (nextOpen: boolean, eventDetails: { cancel: () => void }) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    setConfirmOpen(nextOpen)
  }

  // Still busy after a removal, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          closeOnClick={false}
          render={
            <Button
              size="icon-sm"
              disabled={disabled}
              variant="destructive-outline"
              onClick={() => {
                setConfirmOpen(true)
              }}
              aria-label={m.residential_remove_vehicle_label({ plate })}
            >
              <IconUnlink />
            </Button>
          }
        />

        <TooltipPopup>{m.residential_remove_vehicle_label({ plate })}</TooltipPopup>
      </Tooltip>

      <ResponsiveAlertDialog
        open={isConfirmOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={(isOpen) => {
          // Clears `success`, which keeps the buttons busy while the dialog closes.
          if (!isOpen) {
            mutation.reset()
          }
        }}
      >
        <ResponsiveAlertDialogPopup>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              {m.residential_remove_vehicle_title({ plate, number: house.number })}
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              {m.residential_remove_vehicle_description()}
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>

          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
              {m.common_action_cancel()}
            </ResponsiveAlertDialogClose>
            <Button
              variant="destructive"
              loading={isBusy}
              onClick={() => {
                mutation.mutate()
              }}
            >
              {m.common_action_remove()}
            </Button>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogPopup>
      </ResponsiveAlertDialog>
    </>
  )
}

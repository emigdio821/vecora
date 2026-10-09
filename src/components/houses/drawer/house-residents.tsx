import { IconUserMinus, IconUsers } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CollapsibleSection, Muted } from '@/components/shared/details'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
import { m } from '@/paraglide/messages'
import { unassignResident } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'
import { RELATIONSHIP_LABEL, sortByRelationship } from '../relationship'
import { AssignResidentsDrawer } from './assign-residents'

interface HouseResidentsProps {
  house: HouseQueryData
  /** Blocks assign/unassign, e.g. while the parent form is saving. */
  disabled?: boolean
}

/** Editable list of the people linked to a house: unassign inline, assign via a nested drawer. */
export function HouseResidents({ house, disabled }: HouseResidentsProps) {
  const [isAssignOpen, setAssignOpen] = useState(false)
  const residents = sortByRelationship(house.property_residents)

  return (
    <CollapsibleSection icon={<IconUsers />} title={m.common_section_residents()} count={residents.length}>
      {residents.length ? (
        <ul className="grid gap-3">
          {residents.map(({ resident, relationship }) => (
            <li key={resident.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="grid min-w-0 gap-0.5">
                <span className="truncate font-medium">
                  {resident.first_name} {resident.last_name}
                </span>
                <span className="truncate text-xs text-muted-foreground">{resident.phone}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="outline">{RELATIONSHIP_LABEL[relationship]}</Badge>
                <UnassignResidentButton house={house} resident={resident} disabled={disabled} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Muted>{m.residential_house_no_residents()}</Muted>
      )}

      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setAssignOpen(true)
        }}
      >
        {m.residential_assign_residents()}
      </Button>

      {/* Rendered inside the parent popup so Base UI treats it as a nested drawer. */}
      <AssignResidentsDrawer house={house} open={isAssignOpen} onOpenChange={setAssignOpen} />
    </CollapsibleSection>
  )
}

type LinkedResident = HouseQueryData['property_residents'][number]['resident']

function UnassignResidentButton({
  house,
  resident,
  disabled,
}: {
  house: HouseQueryData
  resident: LinkedResident
  disabled?: boolean
}) {
  const queryClient = useQueryClient()
  const [isConfirmOpen, setConfirmOpen] = useState(false)
  const name = `${resident.first_name} ${resident.last_name}`

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await unassignResident(house.id, resident.id)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      // Both sides of the link show it: the house's residents and each resident's houses.
      void queryClient.invalidateQueries({ queryKey: [HOUSES_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.residential_resident_removed(),
        description: m.residential_unassigned_description({ name, number: house.number }),
      })
      setConfirmOpen(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_remove_failed(), description: error.message })
    },
  })

  const handleOpenChange: AlertDialogPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
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
              aria-label={m.residential_remove_resident_from_house({ name })}
            >
              <IconUserMinus />
            </Button>
          }
        />

        <TooltipPopup>{m.residential_remove_resident_from_house({ name })}</TooltipPopup>
      </Tooltip>

      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={(isOpen) => {
          // Clears `success`, which keeps the buttons busy while the dialog closes.
          if (!isOpen) {
            mutation.reset()
          }
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m.residential_remove_resident_title({ name, number: house.number })}
            </AlertDialogTitle>
            <AlertDialogDescription>{m.residential_remove_resident_description()}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
              {m.common_action_cancel()}
            </AlertDialogClose>
            <Button
              variant="destructive"
              loading={isBusy}
              onClick={() => {
                mutation.mutate()
              }}
            >
              {m.common_action_remove()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  )
}

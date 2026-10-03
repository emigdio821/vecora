import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HouseIcon, UnlinkIcon } from 'lucide-react'
import { useState } from 'react'
import { RELATIONSHIP_LABEL } from '@/components/houses/relationship'
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
import { unassignResident } from '@/server-actions/houses'
import { HOUSES_QUERY_KEY } from '@/tanstack-queries/houses'
import { RESIDENTS_QUERY_KEY, type ResidentQueryData } from '@/tanstack-queries/residents'
import { AssignHouseDrawer } from './assign-house'

interface ResidentHousesProps {
  resident: ResidentQueryData
  /** Blocks assign/unassign, e.g. while the parent form is saving. */
  disabled?: boolean
}

/**
 * Editable list of the houses a resident is linked to: unassign inline, assign
 * via a nested drawer. The house side has the same list for its residents.
 */
export function ResidentHouses({ resident, disabled }: ResidentHousesProps) {
  const [isAssignOpen, setAssignOpen] = useState(false)
  const links = [...resident.property_residents].sort((a, b) =>
    a.property.number.localeCompare(b.property.number, 'es', { numeric: true }),
  )

  return (
    <CollapsibleSection icon={<HouseIcon />} title="Casas" count={links.length}>
      {links.length ? (
        <ul className="grid gap-3">
          {links.map(({ property, relationship }) => (
            <li key={property.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">Casa {property.number}</span>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="outline">{RELATIONSHIP_LABEL[relationship]}</Badge>
                <UnassignHouseButton resident={resident} house={property} disabled={disabled} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Muted>No está asignado a ninguna casa.</Muted>
      )}

      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setAssignOpen(true)
        }}
      >
        Asignar casa
      </Button>

      {/* Rendered inside the parent popup so Base UI treats it as a nested drawer. */}
      <AssignHouseDrawer resident={resident} open={isAssignOpen} onOpenChange={setAssignOpen} />
    </CollapsibleSection>
  )
}

type LinkedHouse = ResidentQueryData['property_residents'][number]['property']

function UnassignHouseButton({
  resident,
  house,
  disabled,
}: {
  resident: ResidentQueryData
  house: LinkedHouse
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
        title: 'Casa quitada',
        description: `${name} ya no está asignado a la casa ${house.number}`,
      })
      setConfirmOpen(false)
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

    setConfirmOpen(nextOpen)
  }

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
              aria-label={`Quitar la casa ${house.number}`}
            >
              <UnlinkIcon />
            </Button>
          }
        />

        <TooltipPopup>Quitar la casa {house.number}</TooltipPopup>
      </Tooltip>

      <AlertDialog open={isConfirmOpen} onOpenChange={handleOpenChange}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Quitar a {name} de la casa {house.number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de aparecer como residente de esta casa. Podrás volver a asignarlo después.
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
    </>
  )
}

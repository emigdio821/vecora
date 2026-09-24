'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserMinusIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import { CollapsibleSection, Muted } from '@/components/shared/details'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip'
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
    <CollapsibleSection icon={<UsersIcon />} title="Residentes" count={residents.length}>
      {residents.length ? (
        <ul className="grid gap-3">
          {residents.map(({ resident, relationship }) => (
            <li key={resident.id} className="flex items-center justify-between gap-3 text-sm">
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
        <Muted>Nadie está asignado a esta casa.</Muted>
      )}

      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="justify-self-start"
        onClick={() => setAssignOpen(true)}
      >
        Asignar residentes
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
        title: 'Residente quitado',
        description: `${name} ya no está asignado a la casa ${house.number}`,
      })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'No se pudo quitar', description: error.message })
    },
  })

  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        render={
          <Button
            size="icon-sm"
            disabled={disabled}
            loading={mutation.isPending}
            variant="destructive-outline"
            onClick={() => mutation.mutate()}
            aria-label={`Quitar a ${name} de la casa`}
          >
            <UserMinusIcon />
          </Button>
        }
      />

      <TooltipPopup>Quitar a {name} de la casa</TooltipPopup>
    </Tooltip>
  )
}

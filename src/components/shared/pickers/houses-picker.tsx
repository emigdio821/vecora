'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  type ComboboxPrimitive,
  ComboboxValue,
} from '@/components/ui/combobox'
import { housesPickerQueryOptions } from '@/tanstack-queries/houses'

type HousesPickerProps = Omit<ComboboxPrimitive.Root.Props<string, boolean | undefined>, 'items'>

export function houseLabel(house: { number: string }) {
  return `Casa ${house.number}`
}

/** Pick one house (`string | null`) or, with `multiple`, several (`string[]`), by id. */
export function HousesPicker(props: HousesPickerProps) {
  const { data, isPending, isError } = useQuery(housesPickerQueryOptions())

  const byId = useMemo(() => new Map(data?.map((house) => [house.id, house])), [data])
  const items = useMemo(() => data?.map((house) => house.id) ?? [], [data])

  function label(id: string) {
    const house = byId.get(id)
    return house ? houseLabel(house) : ''
  }

  return (
    <Combobox items={items} itemToStringLabel={label} autoHighlight {...props}>
      {props.multiple ? (
        <ComboboxChips>
          <ComboboxValue>
            {(value: string[] | null) => (
              <>
                {value?.map((id) => (
                  <ComboboxChip key={id} aria-label={label(id)} removeProps={{ 'aria-label': 'Quitar' }}>
                    {label(id)}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={value?.length ? undefined : 'Buscar casas'} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
      ) : (
        <ComboboxInput
          placeholder="Buscar casa"
          showClear
          clearProps={{ 'aria-label': 'Limpiar selección' }}
        />
      )}
      <ComboboxPopup>
        <ComboboxEmpty>
          {isPending ? 'Cargando casas…' : isError ? 'No se pudieron cargar las casas' : 'Sin resultados.'}
        </ComboboxEmpty>
        <ComboboxList>
          {(id: string) => {
            const owners = byId.get(id)?.owners ?? []
            return (
              <ComboboxItem key={id} value={id}>
                <div className="grid gap-0.5">
                  <span className="truncate">{label(id)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {owners
                      .map(({ resident }) => `${resident.first_name} ${resident.last_name}`)
                      .join(', ') || 'Sin propietario'}
                  </span>
                </div>
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

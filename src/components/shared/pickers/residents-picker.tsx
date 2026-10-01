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
import { residentsPickerQueryOptions } from '@/tanstack-queries/residents'

interface ResidentsPickerProps extends Omit<
  ComboboxPrimitive.Root.Props<string, boolean | undefined>,
  'items'
> {
  /** `unassigned` lists only residents without a house. */
  scope?: 'all' | 'unassigned'
  /** Hide these residents, e.g. the ones already linked to the house being edited. */
  excludeIds?: string[]
}

/** Pick one resident (`string | null`) or, with `multiple`, several (`string[]`), by id. */
export function ResidentsPicker({ scope = 'all', excludeIds, ...props }: ResidentsPickerProps) {
  const { data, isPending, isError } = useQuery(residentsPickerQueryOptions())

  // Built from every resident, so chips can still name a selection the list hides.
  const byId = useMemo(() => new Map(data?.map((resident) => [resident.id, resident])), [data])
  const items = useMemo(
    () =>
      (data ?? [])
        .filter((resident) => !excludeIds?.includes(resident.id))
        .filter((resident) => scope === 'all' || resident.property_residents.length === 0)
        .map((resident) => resident.id),
    [data, excludeIds, scope],
  )

  function label(id: string) {
    const resident = byId.get(id)
    return resident ? `${resident.first_name} ${resident.last_name}` : ''
  }

  // Just the house: contact details live in the residents section.
  function details(id: string) {
    const numbers = byId.get(id)?.property_residents.map((pr) => pr.property.number) ?? []
    return numbers.length > 0 ? `Casa ${numbers.join(', ')}` : 'Sin casa'
  }

  const emptyMessage = isPending
    ? 'Cargando residentes…'
    : isError
      ? 'No se pudieron cargar los residentes'
      : scope === 'unassigned' && items.length === 0
        ? 'Todos los residentes ya tienen casa'
        : 'Sin resultados.'

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
                <ComboboxChipsInput placeholder={value?.length ? undefined : 'Buscar residentes'} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
      ) : (
        <ComboboxInput
          placeholder="Buscar residente"
          showClear
          clearProps={{ 'aria-label': 'Limpiar selección' }}
        />
      )}
      <ComboboxPopup>
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(id: string) => (
            <ComboboxItem key={id} value={id}>
              <div className="grid gap-0.5">
                <span className="truncate">{label(id)}</span>
                <span className="truncate text-xs text-muted-foreground">{details(id)}</span>
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

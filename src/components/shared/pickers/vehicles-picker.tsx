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
import { VEHICLE_KIND_LABEL } from '@/components/vehicles/vehicle'
import { m } from '@/paraglide/messages'
import { vehiclesListQueryOptions } from '@/tanstack-queries/vehicles'

interface VehiclesPickerProps extends Omit<
  ComboboxPrimitive.Root.Props<string, boolean | undefined>,
  'items'
> {
  /** `unassigned` lists only vehicles without a house. */
  scope?: 'all' | 'unassigned'
  /** Hide these vehicles, e.g. the ones already on the house being edited. */
  excludeIds?: string[]
}

/** Pick one vehicle (`string | null`) or, with `multiple`, several (`string[]`), by id. */
export function VehiclesPicker({ scope = 'all', excludeIds, ...props }: VehiclesPickerProps) {
  // The Vehicles tab's list: it already has each vehicle's house.
  const { data, isPending, isError } = useQuery(vehiclesListQueryOptions)

  // Built from every vehicle, so chips can still name a selection the list hides.
  const byId = useMemo(() => new Map(data?.map((vehicle) => [vehicle.id, vehicle])), [data])
  const items = useMemo(
    () =>
      (data ?? [])
        .filter((vehicle) => !excludeIds?.includes(vehicle.id))
        .filter((vehicle) => scope === 'all' || vehicle.property === null)
        .sort((a, b) => a.plate.localeCompare(b.plate, 'es', { numeric: true }))
        .map((vehicle) => vehicle.id),
    [data, excludeIds, scope],
  )

  function label(id: string) {
    const vehicle = byId.get(id)
    return vehicle ? vehicle.plate : ''
  }

  // The type and where it is now, so moving one from another house is a conscious choice.
  function details(id: string) {
    const vehicle = byId.get(id)
    if (!vehicle) return ''
    const kind = VEHICLE_KIND_LABEL[vehicle.kind]
    if (vehicle.property) {
      return `${kind} - ${m.common_house_label({ number: vehicle.property.number })}`
    }
    return `${kind} - ${m.common_no_house()}`
  }

  function emptyMessage() {
    if (isPending) return m.common_loading_vehicles()
    if (isError) return m.common_vehicles_load_failed()
    if (scope === 'unassigned' && items.length === 0) return m.common_all_vehicles_have_house()
    return m.common_no_results()
  }

  return (
    <Combobox items={items} itemToStringLabel={label} autoHighlight {...props}>
      {props.multiple ? (
        <ComboboxChips>
          <ComboboxValue>
            {(value: string[] | null) => (
              <>
                {value?.map((id) => (
                  <ComboboxChip
                    key={id}
                    aria-label={label(id)}
                    removeProps={{ 'aria-label': m.common_action_remove() }}
                  >
                    {label(id)}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={value?.length ? undefined : m.common_search_vehicles()} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
      ) : (
        <ComboboxInput
          placeholder={m.common_search_vehicle()}
          showClear
          clearProps={{ 'aria-label': m.common_clear_selection() }}
        />
      )}
      <ComboboxPopup>
        <ComboboxEmpty>{emptyMessage()}</ComboboxEmpty>
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

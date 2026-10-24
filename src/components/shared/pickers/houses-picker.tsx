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
import { m } from '@/paraglide/messages'
import { housesPickerQueryOptions, supabaseHousesPickerQueryOptions } from '@/tanstack-queries/houses'

type HousesPickerProps = Omit<ComboboxPrimitive.Root.Props<string, boolean | undefined>, 'items'> & {
  /** Hide these houses, e.g. the ones already linked to the resident being edited. */
  excludeIds?: string[]
  /**
   * The houses as Supabase has them, for a form that still saves there (house ids
   * differ between the two databases). Goes away once Treasury and Presidency move to Neon.
   */
  fromSupabase?: boolean
}

export function houseLabel(house: { number: string }) {
  return m.common_house_label({ number: house.number })
}

/** Pick one house (`string | null`) or, with `multiple`, several (`string[]`), by id. */
export function HousesPicker({ excludeIds, fromSupabase = false, ...props }: HousesPickerProps) {
  const neonHouses = useQuery({ ...housesPickerQueryOptions, enabled: !fromSupabase })
  const supabaseHouses = useQuery({ ...supabaseHousesPickerQueryOptions, enabled: fromSupabase })
  const { data, isPending, isError } = fromSupabase ? supabaseHouses : neonHouses

  const byId = useMemo(() => new Map(data?.map((house) => [house.id, house])), [data])
  const items = useMemo(
    () => (data ?? []).filter((house) => !excludeIds?.includes(house.id)).map((house) => house.id),
    [data, excludeIds],
  )

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
                  <ComboboxChip
                    key={id}
                    aria-label={label(id)}
                    removeProps={{ 'aria-label': m.common_action_remove() }}
                  >
                    {label(id)}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={value?.length ? undefined : m.common_search_houses()} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
      ) : (
        <ComboboxInput
          placeholder={m.common_search_house()}
          showClear
          clearProps={{ 'aria-label': m.common_clear_selection() }}
        />
      )}
      <ComboboxPopup>
        <ComboboxEmpty>
          {isPending
            ? m.common_loading_houses()
            : isError
              ? m.common_houses_load_failed()
              : m.common_no_results()}
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
                      .join(', ') || m.common_no_owner()}
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

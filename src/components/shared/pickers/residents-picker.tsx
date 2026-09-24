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
  createComboboxItems,
} from '@/components/ui/combobox'
import { normalizeString } from '@/lib/utils'
import { type PickerResident, residentsPickerQueryOptions } from '@/tanstack-queries/residents'

/** Which residents to list. `unassigned` = not linked to any house. */
export type ResidentsPickerScope = 'all' | 'unassigned'

interface ResidentsPickerBaseProps {
  scope?: ResidentsPickerScope
  /** Hide these residents, e.g. the ones already linked to the house being edited. */
  excludeIds?: readonly string[]
  placeholder?: string
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  /** Form field name; also inherited from a wrapping `Field`. */
  name?: string
  id?: string
  'aria-label'?: string
  inputRef?: React.Ref<HTMLInputElement>
}

interface ResidentsPickerSingleProps extends ResidentsPickerBaseProps {
  multiple?: false
  value: string | null
  onValueChange: (value: string | null) => void
}

interface ResidentsPickerMultipleProps extends ResidentsPickerBaseProps {
  multiple: true
  value: string[]
  onValueChange: (value: string[]) => void
}

export type ResidentsPickerProps = ResidentsPickerSingleProps | ResidentsPickerMultipleProps

export function residentFullName(resident: Pick<PickerResident, 'first_name' | 'last_name'>) {
  return `${resident.first_name} ${resident.last_name}`
}

function houseLabel(resident: PickerResident) {
  const numbers = resident.property_residents.map((pr) => pr.property.number)
  if (numbers.length === 0) return 'Sin casa'
  return `${numbers.length === 1 ? 'Casa' : 'Casas'} ${numbers.join(', ')}`
}

/** Accent-insensitive match on name, phone and email (the default only checks the label). */
function filterResident(resident: PickerResident, query: string) {
  const needle = normalizeString(query)
  if (!needle) return true

  return (
    normalizeString(residentFullName(resident)).includes(needle) ||
    normalizeString(resident.phone).includes(needle) ||
    normalizeString(resident.email).includes(needle)
  )
}

/**
 * Combobox of active residents, single (`string | null`) or multiple (`string[]`) by id.
 * Selected residents stay listed even when `scope` or `excludeIds` would hide them, so the
 * input can always resolve their names.
 */
export function ResidentsPicker(props: ResidentsPickerProps) {
  const {
    scope = 'all',
    excludeIds,
    placeholder = 'Buscar residente…',
    size,
    disabled,
    readOnly,
    required,
    name,
    id,
    'aria-label': ariaLabel,
    inputRef,
  } = props

  const { data, isPending, isError } = useQuery(residentsPickerQueryOptions())

  const selectedIds = useMemo(() => {
    if (props.multiple) return new Set(props.value)
    return new Set(props.value ? [props.value] : [])
  }, [props.multiple, props.value])

  const residents = useMemo(() => {
    if (!data) return undefined
    const excluded = new Set(excludeIds)

    return data.filter((resident) => {
      if (selectedIds.has(resident.id)) return true
      if (excluded.has(resident.id)) return false
      return scope === 'all' || resident.property_residents.length === 0
    })
  }, [data, excludeIds, scope, selectedIds])

  const byId = useMemo(() => new Map(residents?.map((r) => [r.id, r])), [residents])

  // `undefined` data keeps the combobox in a "loading" state instead of "empty".
  const items = useMemo(
    () =>
      createComboboxItems(residents, {
        getValue: (resident) => resident.id,
        getLabel: residentFullName,
      }),
    [residents],
  )

  const emptyMessage = isPending
    ? 'Cargando residentes…'
    : isError
      ? 'No se pudieron cargar los residentes'
      : scope === 'unassigned' && residents?.length === 0
        ? 'Todos los residentes ya tienen casa'
        : 'No se encontraron residentes'

  const popup = (
    <ComboboxPopup>
      <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
      <ComboboxList>
        {(resident: PickerResident) => (
          <ComboboxItem key={resident.id} value={resident.id}>
            <div className="grid gap-0.5">
              <span className="truncate">{residentFullName(resident)}</span>
              <span className="truncate text-xs text-muted-foreground">
                {resident.phone}
                {scope === 'all' && ` · ${houseLabel(resident)}`}
              </span>
            </div>
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxPopup>
  )

  const rootProps = {
    items,
    filter: filterResident,
    disabled,
    readOnly,
    required,
    name,
    id,
    inputRef,
  } satisfies Partial<ComboboxPrimitive.Root.Props<string, boolean, PickerResident>>

  if (props.multiple) {
    return (
      <Combobox<string, true, PickerResident>
        {...rootProps}
        multiple
        value={props.value}
        onValueChange={(value) => props.onValueChange(value)}
      >
        <ComboboxChips>
          <ComboboxValue>
            {(value: string[]) => (
              <>
                {value.map((residentId) => {
                  const resident = byId.get(residentId)
                  const label = resident ? residentFullName(resident) : 'Residente'
                  return (
                    <ComboboxChip
                      key={residentId}
                      aria-label={label}
                      removeProps={{ 'aria-label': 'Quitar' }}
                    >
                      {label}
                    </ComboboxChip>
                  )
                })}
                <ComboboxChipsInput
                  aria-label={ariaLabel}
                  placeholder={value.length > 0 ? undefined : placeholder}
                  size={size}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        {popup}
      </Combobox>
    )
  }

  return (
    <Combobox<string, false, PickerResident>
      {...rootProps}
      value={props.value}
      onValueChange={(value) => props.onValueChange(value)}
    >
      <ComboboxInput
        aria-label={ariaLabel}
        placeholder={placeholder}
        size={size}
        showClear
        clearProps={{ 'aria-label': 'Limpiar selección' }}
      />
      {popup}
    </Combobox>
  )
}

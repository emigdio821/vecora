import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { availableHousesQueryOptions } from '@/api/tanstack-queries/houses'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Skeleton } from '../ui/skeleton'

interface HouseItem {
  label: string
  value: string
}

interface HouseSelectorProps {
  disabled?: boolean
  invalid?: boolean
  value: string[]
  onValueChange: (value: string[]) => void
  id?: string
  includeAssigned?: { id: string; houseNumber: string }[]
}

export function AvailableHousesSelector({
  disabled = false,
  invalid = false,
  value,
  onValueChange,
  id,
  includeAssigned = [],
}: HouseSelectorProps) {
  const { data: availableHouses = [], isLoading: isLoadingAvailableHouses } = useQuery(
    availableHousesQueryOptions(),
  )

  const items: HouseItem[] = useMemo(() => {
    const assignedItems = includeAssigned.map((house) => ({ label: house.houseNumber, value: house.id }))
    const availableItems = availableHouses.map((house) => ({ label: house.houseNumber, value: house.id }))

    const allItems = [...assignedItems, ...availableItems]
    const uniqueItems = allItems.filter(
      (item, index, self) => index === self.findIndex((t) => t.value === item.value),
    )

    return uniqueItems
  }, [availableHouses, includeAssigned])

  if (isLoadingAvailableHouses) return <Skeleton className="h-8 w-full rounded-lg" />

  if (availableHouses.length === 0 && includeAssigned.length === 0) {
    return (
      <div className="flex h-9 w-full items-center rounded-lg border border-input bg-muted px-3 text-muted-foreground text-sm">
        No hay casas disponibles
      </div>
    )
  }

  return (
    <Combobox
      multiple
      value={items.filter((item) => value.includes(item.value))}
      onValueChange={(selectedItems: HouseItem[]) => {
        onValueChange(selectedItems.map((item) => item.value))
      }}
      items={items}
      disabled={disabled}
    >
      <ComboboxChips aria-invalid={invalid} id={id}>
        {value.map((houseId) => {
          const house =
            availableHouses.find((h) => h.id === houseId) || includeAssigned.find((h) => h.id === houseId)
          return house ? <ComboboxChip key={houseId}>{house.houseNumber}</ComboboxChip> : null
        })}
        <ComboboxInput placeholder={value.length > 0 ? undefined : 'Selecciona casas'} />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
        <ComboboxList>
          {(item: HouseItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

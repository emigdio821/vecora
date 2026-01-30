import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { availableHousesQueryOptions } from '@/api/tanstack-queries/houses'
import { Skeleton } from '@/components/ui/skeleton'
import { ComboboxMultiSelect, type ComboboxMultiSelectProps } from './multi-select'

interface AvailableHousesSelectorProps extends Omit<ComboboxMultiSelectProps, 'items'> {
  includeAssigned?: { id: string; houseNumber: string }[]
}

export function AvailableHousesSelector({
  includeAssigned = [],
  ...comboboxProps
}: AvailableHousesSelectorProps) {
  const { data: availableHouses = [], isLoading: isLoadingAvailableHouses } = useQuery(
    availableHousesQueryOptions(),
  )

  const items = useMemo(() => {
    const assignedItems = includeAssigned.map((house) => ({ label: house.houseNumber, value: house.id }))
    const availableItems = availableHouses.map((house) => ({ label: house.houseNumber, value: house.id }))

    const allItems = [...assignedItems, ...availableItems]
    const uniqueItems = allItems.filter(
      (item, index, self) => index === self.findIndex((t) => t.value === item.value),
    )

    return uniqueItems
  }, [availableHouses, includeAssigned])

  if (isLoadingAvailableHouses) return <Skeleton className="h-8 w-full rounded-lg" />

  return <ComboboxMultiSelect isLoading={isLoadingAvailableHouses} items={items} {...comboboxProps} />
}

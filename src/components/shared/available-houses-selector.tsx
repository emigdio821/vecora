import { useQuery } from '@tanstack/react-query'
import { availableHousesQueryOptions } from '@/api/tanstack-queries/houses'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '../ui/skeleton'

interface HouseSelectorProps extends React.ComponentProps<typeof Select> {
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

export function AvailableHousesSelector({
  disabled = false,
  invalid = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  value,
  ...selectProps
}: HouseSelectorProps) {
  const { data: availableHouses = [], isLoading: isLoadingAvailableHouses } = useQuery(
    availableHousesQueryOptions(),
  )

  function renderAvailableHousesValue(value: string | null) {
    if (availableHouses.length === 0) return 'No hay casas disponibles'

    const house = availableHouses.find((house) => house.id === value)
    return house ? `${house.houseNumber}` : placeholder
  }

  if (isLoadingAvailableHouses) return <Skeleton className="h-8 w-full rounded-lg" />

  return (
    <Select value={value} disabled={availableHouses.length === 0 || disabled} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderAvailableHousesValue(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNoneOption && <SelectItem value={null}>{noneOptionLabel}</SelectItem>}
          {availableHouses.map((house) => (
            <SelectItem key={house.id} value={house.id}>
              {house.houseNumber}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

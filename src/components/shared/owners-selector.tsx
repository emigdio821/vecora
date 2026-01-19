import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ownersListQueryOptions } from '@/lib/ts-queries/owners'
import { Skeleton } from '../ui/skeleton'

interface HouseSelectorProps extends React.ComponentProps<typeof Select> {
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

export function OwnersSelector({
  disabled = false,
  invalid = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  value,
  ...selectProps
}: HouseSelectorProps) {
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())

  function renderOwnerValue(value: string | null) {
    if (owners.length === 0) return 'No hay propietarios disponibles'

    const owner = owners.find((owner) => owner.id === value)
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Selecciona una opción'
  }

  if (isLoadingOwners) return <Skeleton className="h-8 w-full rounded-lg" />

  return (
    <Select value={value} disabled={owners.length === 0 || disabled} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderOwnerValue(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNoneOption && <SelectItem value={null}>{noneOptionLabel}</SelectItem>}
          {owners.map((owner) => (
            <SelectItem key={owner.id} value={owner.id}>
              <span>{`${owner.firstName} ${owner.lastName}`}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

import { useQuery } from '@tanstack/react-query'
import { ownersListQueryOptions } from '@/api/tanstack-queries/owners'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '../ui/skeleton'

interface OwnersSelectorProps extends React.ComponentProps<typeof Select> {
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
}

export function OwnersSelector({
  disabled = false,
  invalid = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  ...selectProps
}: OwnersSelectorProps) {
  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())

  function renderOwnerValue(value: string | null) {
    if (isLoadingOwners) return <Skeleton className="h-2 w-1/3" />
    if (owners.length === 0) return 'No hay propietarios disponibles'

    const owner = owners.find((owner) => owner.id === value)
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Selecciona una opción'
  }

  return (
    <Select disabled={owners.length === 0 || disabled} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderOwnerValue}</SelectValue>
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

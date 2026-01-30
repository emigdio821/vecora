import { useQuery } from '@tanstack/react-query'
import { externalUsersListQueryOptions } from '@/api/tanstack-queries/external-users'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface ExternalUsersSelectorProps extends React.ComponentProps<typeof Select> {
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
}

export function ExternalUsersSelector({
  disabled = false,
  invalid = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  ...selectProps
}: ExternalUsersSelectorProps) {
  const { data: externalUsers = [], isLoading: isLoadingExternalUsers } = useQuery(
    externalUsersListQueryOptions(),
  )
  function renderOwnerValue(value: string | null) {
    if (isLoadingExternalUsers) return <Skeleton className="h-2 w-1/3" />
    if (externalUsers.length === 0) return 'No hay usuarios externos disponibles'

    const externalUser = externalUsers.find((user) => user.id === value)
    return externalUser ? `${externalUser.firstName} ${externalUser.lastName}` : 'Selecciona una opción'
  }

  return (
    <Select disabled={externalUsers.length === 0 || disabled} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderOwnerValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNoneOption && <SelectItem value={null}>{noneOptionLabel}</SelectItem>}
          {externalUsers.map((externalUser) => (
            <SelectItem key={externalUser.id} value={externalUser.id}>
              <span>{`${externalUser.firstName} ${externalUser.lastName}`}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

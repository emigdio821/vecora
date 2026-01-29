import { useQuery } from '@tanstack/react-query'
import { profileRolesListQueryOptions } from '@/api/tanstack-queries/profiles'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { profileTypeEnum } from '@/db/schemas/main'
import type { ProfileType } from '@/db/schemas/zod/profiles'

interface ProfileTypeSelectorProps extends React.ComponentProps<typeof Select> {
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

export function ProfileTypeSelector({
  disabled = false,
  invalid = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  value,
  ...selectProps
}: ProfileTypeSelectorProps) {
  function getProfileTypeLabel(profileType: ProfileType) {
    switch (profileType) {
      case 'owner':
        return 'Propietario'
      case 'external':
        return 'Usuario Externo'
      default:
        return profileType
    }
  }

  function renderProfileTypeValue(value: ProfileType | null) {
    if (roles.length === 0) return 'No hay propietarios disponibles'

    const role = roles.find((role) => role.id === value)
    return role ? getProfileTypeLabel(role.name) : 'Selecciona una opción'
  }

  return (
    <Select value={value} disabled={disabled} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderProfileTypeValue(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNoneOption && <SelectItem value={null}>{noneOptionLabel}</SelectItem>}
          {profileTypeEnum.enumValues.map((profileType) => (
            <SelectItem key={profileType} value={profileType}>
              <span>{getProfileTypeLabel(profileType)}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

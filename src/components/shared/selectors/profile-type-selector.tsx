import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { profileTypeEnum } from '@/db/schemas/main'
import type { ProfileType } from '@/db/schemas/zod/profiles'

interface ProfileTypeSelectorProps extends React.ComponentProps<typeof Select> {
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

export function ProfileTypeSelector({
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
    return value ? getProfileTypeLabel(value) : placeholder
  }

  return (
    <Select value={value} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderProfileTypeValue}</SelectValue>
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

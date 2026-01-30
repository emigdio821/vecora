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

interface RolesSelectorProps extends React.ComponentProps<typeof Select> {
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

export function RolesSelector({
  disabled = false,
  invalid = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  ...selectProps
}: RolesSelectorProps) {
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery(profileRolesListQueryOptions())

  function getRoleLabel(roleName: string) {
    switch (roleName) {
      case 'admin':
        return 'Administrador'
      case 'maintainer':
        return 'Mantenimiento'
      case 'treasurer':
        return 'Tesorero'
      case 'president':
        return 'Presidente'
      case 'security':
        return 'Seguridad'
      default:
        return roleName
    }
  }

  function renderRoleValue(value: string | null) {
    if (isLoadingRoles) return <span className="animate-pulse">Cargando datos...</span>

    if (roles.length === 0) return 'No hay roles disponibles'

    const role = roles.find((role) => role.id === value)
    return role ? getRoleLabel(role.name) : 'Selecciona una opción'
  }

  return (
    <Select disabled={roles.length === 0 || disabled} {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderRoleValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNoneOption && <SelectItem value={null}>{noneOptionLabel}</SelectItem>}
          {roles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              <span>{getRoleLabel(role.name)}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

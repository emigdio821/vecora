import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { profileRoleSchema } from '@/db/schema/zod/profiles'

interface RolesSelectorProps extends React.ComponentProps<typeof Select> {
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

function getRoleLabel(roleName: string) {
  switch (roleName) {
    case 'admin':
      return 'Administrador'
    case 'resident':
      return 'Residente'
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

function getRoleDescription(roleName: string) {
  switch (roleName) {
    case 'admin':
      return 'Acceso completo al sistema'
    case 'resident':
      return 'Acceso sin permisos administrativos'
    case 'maintainer':
      return 'Gestión del mantenimiento'
    case 'treasurer':
      return 'Gestión de ingresos y gastos'
    case 'president':
      return 'Gestión general y representación'
    case 'security':
      return 'Gestión de seguridad y vigilancia'
    default:
      return ''
  }
}

export function RolesSelector({
  disabled = false,
  invalid = false,
  placeholder = 'Selecciona una opción',
  includeNoneOption = true,
  noneOptionLabel = 'Sin selección',
  ...selectProps
}: RolesSelectorProps) {
  function renderRoleValue(value: string | null) {
    const role = profileRoleSchema.options.find((role) => role === value)
    return role ? getRoleLabel(role) : 'Selecciona una opción'
  }

  return (
    <Select {...selectProps}>
      <SelectTrigger aria-invalid={invalid} className="w-full">
        <SelectValue>{renderRoleValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {includeNoneOption && <SelectItem value={null}>{noneOptionLabel}</SelectItem>}
          {profileRoleSchema.options.map((role) => (
            <SelectItem key={role} value={role}>
              <div>
                <p className="font-medium">{getRoleLabel(role)}</p>
                <p className="text-muted-foreground! text-xs">{getRoleDescription(role)}</p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

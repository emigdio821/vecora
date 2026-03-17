import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Role } from '@/types/rbac'

interface RolesSelectorProps extends React.ComponentProps<typeof Select> {
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  includeNoneOption?: boolean
  noneOptionLabel?: string
  value: string | null
}

function getRoleLabel(role: Role) {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'Super administrador'
    case Role.ADMIN:
      return 'Administrador'
    case Role.RESIDENT:
      return 'Residente'
    case Role.MAINTENANCE:
      return 'Mantenimiento'
    case Role.TREASURER:
      return 'Tesorero'
    case Role.PRESIDENT:
      return 'Presidente'
    case Role.SECURITY:
      return 'Seguridad'
    default:
      return role
  }
}

function getRoleDescription(role: Role) {
  switch (role) {
    case Role.SUPER_ADMIN:
      return 'Administrador del sistema (solo se puede crear por seed)'
    case Role.ADMIN:
      return 'Acceso completo al sistema'
    case Role.RESIDENT:
      return 'Acceso sin permisos administrativos'
    case Role.MAINTENANCE:
      return 'Gestión del mantenimiento'
    case Role.TREASURER:
      return 'Gestión de ingresos y gastos'
    case Role.PRESIDENT:
      return 'Gestión general y representación'
    case Role.SECURITY:
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
  function renderRoleValue(value: Role | null) {
    const role = Object.values(Role).find((role) => role === value)
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
          {Object.values(Role)
            .filter((role) => role !== Role.SUPER_ADMIN)
            .map((role) => (
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

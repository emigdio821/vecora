import { Badge } from '@/components/ui/badge'

interface RoleNameBadgeProps {
  roleName: string
}

export function RoleNameBadge({ roleName }: RoleNameBadgeProps) {
  function getRoleLabel() {
    switch (roleName) {
      case 'admin':
        return 'Administrador'
      case 'president':
        return 'Presidente'
      case 'treasurer':
        return 'Tesorero'
      case 'maintainer':
        return 'Mantenimiento'
      case 'security':
        return 'Seguridad'
      default:
        return roleName
    }
  }

  return (
    <Badge variant="outline">
      <span>{getRoleLabel()}</span>
    </Badge>
  )
}

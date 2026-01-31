import { Badge } from '@/components/ui/badge'

interface RoleNameBadgeProps extends React.ComponentProps<typeof Badge> {
  roleName: string
}

export function RoleNameBadge({ roleName, ...badgeProps }: RoleNameBadgeProps) {
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
    <Badge variant="outline" {...badgeProps}>
      <span>{getRoleLabel()}</span>
    </Badge>
  )
}

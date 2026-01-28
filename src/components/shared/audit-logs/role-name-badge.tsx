import { Badge } from '@/components/ui/badge'

interface AuditLogRoleNameBadgeProps {
  roleName: string
}

export function AuditLogRoleNameBadge({ roleName }: AuditLogRoleNameBadgeProps) {
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
    <Badge variant="outline" key={roleName}>
      <span>{getRoleLabel()}</span>
    </Badge>
  )
}

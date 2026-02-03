import { Badge, type BadgeProps } from '@/components/ui/badge'

interface MemberStatusBadgeProps extends BadgeProps {
  deleted: boolean
}

export function MemberStatusBadge({ deleted, ...badgeProps }: MemberStatusBadgeProps) {
  function getStatusLabel() {
    switch (deleted) {
      case true:
        return 'Eliminado'
      case false:
        return 'Activo'
      default:
        return deleted
    }
  }

  function getBadgeVariant() {
    switch (deleted) {
      case true:
        return 'destructive'
      case false:
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <Badge variant={getBadgeVariant()} {...badgeProps}>
      {getStatusLabel()}
    </Badge>
  )
}

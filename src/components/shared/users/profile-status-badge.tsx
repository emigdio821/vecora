import { Badge, type BadgeProps } from '@/components/ui/badge'

interface ProfileStatusBadgeProps extends BadgeProps {
  banned: boolean
}

export function ProfileStatusBadge({ banned, ...badgeProps }: ProfileStatusBadgeProps) {
  function getStatusLabel() {
    switch (banned) {
      case true:
        return 'Suspendido'
      case false:
        return 'Activo'
      default:
        return banned
    }
  }

  function getBadgeVariant() {
    switch (banned) {
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

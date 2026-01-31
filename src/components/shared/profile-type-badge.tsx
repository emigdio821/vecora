import { Badge } from '@/components/ui/badge'
import type { ProfileType } from '@/db/schemas/zod/profiles'

interface ProfileTypeBadgeProps extends React.ComponentProps<typeof Badge> {
  type: ProfileType
}

export function ProfileTypeBadge({ type, ...badgeProps }: ProfileTypeBadgeProps) {
  function getRoleLabel() {
    switch (type) {
      case 'external':
        return 'Externo'
      case 'owner':
        return 'Propietario'
      default:
        return type
    }
  }

  return (
    <Badge variant="outline" {...badgeProps}>
      <span>{getRoleLabel()}</span>
    </Badge>
  )
}

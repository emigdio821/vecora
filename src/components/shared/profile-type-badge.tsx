import { Badge } from '@/components/ui/badge'
import type { ProfileType } from '@/db/schemas/zod/profiles'

interface ProfileTypeBadgeProps {
  type: ProfileType
}

export function ProfileTypeBadge({ type }: ProfileTypeBadgeProps) {
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
    <Badge variant="outline">
      <span>{getRoleLabel()}</span>
    </Badge>
  )
}

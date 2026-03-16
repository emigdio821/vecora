import { Badge } from '@/components/ui/badge'

interface ProfileTypeBadgeProps extends React.ComponentProps<typeof Badge> {
  isOwner: boolean
}

export function ProfileTypeBadge({ isOwner, ...badgeProps }: ProfileTypeBadgeProps) {
  return (
    <Badge variant="outline" {...badgeProps}>
      <span>{isOwner ? 'Propietario' : 'Residente'}</span>
    </Badge>
  )
}

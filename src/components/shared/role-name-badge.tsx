import { Badge } from '@/components/ui/badge'
import { getRoleLabel } from '@/lib/utils'

interface RoleNameBadgeProps extends React.ComponentProps<typeof Badge> {
  roleName: string
}

export function RoleNameBadge({ roleName, ...badgeProps }: RoleNameBadgeProps) {
  return (
    <Badge variant="outline" {...badgeProps}>
      <span>{getRoleLabel(roleName)}</span>
    </Badge>
  )
}

import { Badge, type BadgeProps } from '@/components/ui/badge'

interface HouseNumberBadgeProps extends BadgeProps {
  number: string
}

export function HouseNumberBadge({ number, ...badgeProps }: HouseNumberBadgeProps) {
  return (
    <Badge variant="outline" {...badgeProps}>
      {number}
    </Badge>
  )
}

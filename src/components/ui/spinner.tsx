import { IconLoader2, type IconProps } from '@tabler/icons-react'
import type React from 'react'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'

export function Spinner({ className, ...props }: IconProps): React.ReactElement {
  return (
    <IconLoader2
      aria-label={m.common_loading()}
      className={cn('animate-spin', className)}
      role="status"
      {...props}
    />
  )
}

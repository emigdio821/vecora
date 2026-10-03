import { IconLoader } from '@tabler/icons-react'
import { type LinkProps, useMatchRoute } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/**
 * Goes inside a sidebar <Link>: a spinner while its page (`to`, same as the
 * link's) is on the way. It fades in after 200 ms, so quick navigations show
 * nothing, and always takes its space so the label doesn't shift.
 */
export function LinkPendingIndicator({ to }: { to: LinkProps['to'] }) {
  const matchRoute = useMatchRoute()
  const pending = !!matchRoute({ to, pending: true })

  return (
    <IconLoader
      aria-hidden
      className={cn(
        'ms-auto size-3.5 text-muted-foreground opacity-0',
        pending && 'animate-spin opacity-100 transition-opacity delay-200',
      )}
    />
  )
}

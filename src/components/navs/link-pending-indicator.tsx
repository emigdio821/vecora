'use client'

import { LoaderIcon } from 'lucide-react'
import { useLinkStatus } from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Goes inside a sidebar <Link>: a spinner while its page is on the way. It
 * fades in after 200 ms, so quick navigations show nothing, and always takes
 * its space so the label doesn't shift.
 */
export function LinkPendingIndicator() {
  const { pending } = useLinkStatus()

  return (
    <LoaderIcon
      aria-hidden
      className={cn(
        'ms-auto size-3.5 text-muted-foreground opacity-0',
        pending && 'animate-spin opacity-100 transition-opacity delay-200',
      )}
    />
  )
}

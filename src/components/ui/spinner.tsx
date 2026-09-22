import { LoaderIcon, LucideProps } from 'lucide-react'
import type React from 'react'
import { cn } from '@/lib/utils'

export function Spinner({ className, ...props }: LucideProps): React.ReactElement {
  return (
    <LoaderIcon aria-label="Loading" className={cn('animate-spin', className)} role="status" {...props} />
  )
}

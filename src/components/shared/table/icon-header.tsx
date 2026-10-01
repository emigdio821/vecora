import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DataTableIconHeaderProps {
  icon: ReactNode
  /** Tooltip text; also used as the accessible label for the column. */
  tipContent: string
  className?: string
}

/**
 * Compact header for narrow columns: shows only an icon, with the label in a tooltip.
 *
 *   header: () => <DataTableIconHeader tipContent="Pagos" icon={<CircleDollarSignIcon />} />
 */
export function DataTableIconHeader({ icon, tipContent, className }: DataTableIconHeaderProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            aria-label={tipContent}
            className={cn('inline-flex items-center text-muted-foreground', className)}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{tipContent}</TooltipContent>
    </Tooltip>
  )
}

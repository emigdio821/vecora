'use client'

import { ChevronDownIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Frame, FrameHeader, FramePanel } from '@/components/ui/frame'
import { formatDate } from '@/lib/utils'

/*
 * Building blocks for read-only "details" drawers (resident, house, …).
 */

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  /** Shown as a small badge next to the title, e.g. number of houses. */
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({
  icon,
  title,
  count,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  return (
    <Frame>
      <Collapsible defaultOpen={defaultOpen}>
        <FrameHeader className="flex-row items-center justify-between px-3 py-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold [&_svg]:size-4 [&_svg]:text-muted-foreground">
            {icon}
            {title}
            {count !== undefined && (
              <Badge variant="outline" size="sm">
                {count}
              </Badge>
            )}
          </h3>
          <CollapsibleTrigger
            render={<Button size="icon-sm" variant="ghost" />}
            className="-me-3 [&_svg]:transition-transform data-panel-open:[&_svg]:rotate-180"
            aria-label={`Mostrar u ocultar ${title.toLowerCase()}`}
          >
            <ChevronDownIcon />
          </CollapsibleTrigger>
        </FrameHeader>
        <CollapsiblePanel>
          <FramePanel className="grid gap-3 p-4">{children}</FramePanel>
        </CollapsiblePanel>
      </Collapsible>
    </Frame>
  )
}

export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-normal text-muted-foreground">{children}</span>
}

/** One `<dt>/<dd>` pair; render inside a `<dl>`. */
export function Timestamp({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs [&_svg]:mt-0.5 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
      {icon}
      <div className="grid gap-0.5">
        <dt className="text-muted-foreground">{label}</dt>
        <dd>
          <time dateTime={value} className="font-medium tabular-nums">
            {formatDate(value)}
          </time>
        </dd>
      </div>
    </div>
  )
}

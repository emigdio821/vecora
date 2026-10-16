import type { TablerIcon } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'

interface DashboardCardErrorProps {
  title: string
  description?: string
  icon: TablerIcon
  onRetry: () => void
  /** The card's panel classes, so it keeps its loaded height. */
  panelClassName?: string
  /** Invisible content that holds the panel's height, for cards without a fixed one. */
  spacer?: React.ReactNode
}

/** A dashboard card whose data didn't load: it keeps its place in the grid, with a retry. */
export function DashboardCardError({
  title,
  description,
  icon: Icon,
  onRetry,
  panelClassName,
  spacer,
}: DashboardCardErrorProps) {
  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{title}</CardFrameTitle>
        {description && <CardFrameDescription>{description}</CardFrameDescription>}
        <CardFrameAction className="text-muted-foreground">
          <Icon />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className={cn('grid', panelClassName)}>
          {spacer && (
            <div aria-hidden className="invisible col-start-1 row-start-1">
              {spacer}
            </div>
          )}
          <Empty className="col-start-1 row-start-1 h-full py-0 md:py-0">
            <EmptyHeader>
              <EmptyTitle>{m.common_error()}</EmptyTitle>
              <EmptyDescription>{m.common_load_failed_description()}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onRetry()
                }}
              >
                {m.common_action_retry()}
              </Button>
            </EmptyContent>
          </Empty>
        </CardPanel>
      </Card>
    </CardFrame>
  )
}

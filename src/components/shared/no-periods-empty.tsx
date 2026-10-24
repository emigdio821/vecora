import { ParaglideMessage } from '@inlang/paraglide-js-react'
import { IconCalendarOff } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { messageMarkup } from '@/components/shared/message-markup'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { m } from '@/paraglide/messages'

interface NoPeriodsEmptyProps {
  /** "common_no_periods" by default. */
  title?: string
  /** Why there's nothing to pick; the default says movements need a period. */
  description?: React.ReactNode
}

/** In place of a date picker when no period has days to offer, with a way to create one. */
export function NoPeriodsEmpty({ title, description }: NoPeriodsEmptyProps) {
  return (
    <Empty className="w-72 gap-4 px-4 py-6 md:py-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconCalendarOff />
        </EmptyMedia>
        <EmptyTitle>{title ?? m.common_no_periods()}</EmptyTitle>
        <EmptyDescription>
          {description ?? (
            <ParaglideMessage markup={messageMarkup} message={m.common_no_periods_description} />
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" variant="outline" render={<Link to="/presidency" search={{ tab: 'periods' }} />}>
          {m.common_go_to_periods()}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

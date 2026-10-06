import { IconBug } from '@tabler/icons-react'
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

interface TanstackQueryErrorProps extends React.ComponentProps<typeof Empty> {
  refetch: () => void
  errorTitle?: React.ReactNode
  errorDescription?: React.ReactNode
}

export function TanstackQueryError(props: TanstackQueryErrorProps) {
  const {
    refetch,
    errorTitle = m.common_error(),
    errorDescription = m.common_load_failed_description(),
    ...emptyProps
  } = props

  return (
    <Empty {...emptyProps}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBug />
        </EmptyMedia>
        <EmptyTitle>{errorTitle}</EmptyTitle>
        <EmptyDescription>{errorDescription}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              refetch()
            }}
          >
            {m.common_action_retry()}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}

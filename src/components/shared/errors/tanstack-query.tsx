import { BugIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

interface TanstackQueryErrorProps extends React.ComponentProps<typeof Empty> {
  refetch: () => void
  errorTitle?: React.ReactNode
  errorDescription?: React.ReactNode
}

export function TanstackQueryError(props: TanstackQueryErrorProps) {
  const {
    refetch,
    errorTitle = 'Error',
    errorDescription = 'No se pudo cargar la información, por favor intente nuevamente.',
    ...emptyProps
  } = props

  return (
    <Empty {...emptyProps}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BugIcon />
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
            Reintentar
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}

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

interface TSQueryGenericErrorProps extends React.ComponentProps<typeof Empty> {
  refetch: () => void
  errorTitle?: React.ReactNode
  errorDescription?: React.ReactNode
}

export function TSQueryGenericError(props: TSQueryGenericErrorProps) {
  const { refetch, errorTitle = 'Error', errorDescription = 'Algo salió mal.', ...emptyProps } = props

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
        <Button onClick={() => refetch()}>Reintentar</Button>
      </EmptyContent>
    </Empty>
  )
}

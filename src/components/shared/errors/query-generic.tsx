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
}

export function TSQueryGenericError({ refetch, ...props }: TSQueryGenericErrorProps) {
  return (
    <Empty {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBug className="size-4" />
        </EmptyMedia>
        <EmptyTitle>Error</EmptyTitle>
        <EmptyDescription>Algo salió mal al cargar los propietarios.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </EmptyContent>
    </Empty>
  )
}

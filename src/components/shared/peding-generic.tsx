import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { LoaderIcon } from '../icons'

export function PendingGeneric() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LoaderIcon />
        </EmptyMedia>
        <EmptyTitle>Cargando...</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}

import { IconBarrierBlock } from '@tabler/icons-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export function HousesTabContent() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBarrierBlock className="size-4" />
        </EmptyMedia>
        <EmptyTitle>En construcción</EmptyTitle>
        <EmptyDescription>
          Esta sección está en desarrollo. Pronto podrás administrar casas desde aquí.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

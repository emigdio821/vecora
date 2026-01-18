import { IconBarrierBlock } from '@tabler/icons-react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function PaymentsTabContent() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBarrierBlock />
        </EmptyMedia>
        <EmptyTitle>Pagos</EmptyTitle>
        <EmptyDescription>Administrar pagos.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        Esta sección está en desarrollo. Pronto podrás administrar pagos desde aquí.
      </EmptyContent>
    </Empty>
  )
}

import { IconBarrierBlock } from '@tabler/icons-react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function ViolationsTabContent() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBarrierBlock />
        </EmptyMedia>
        <EmptyTitle>Infracciones</EmptyTitle>
        <EmptyDescription>Administrar infracciones.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        Esta sección está en desarrollo. Pronto podrás administrar infracciones desde aquí.
      </EmptyContent>
    </Empty>
  )
}

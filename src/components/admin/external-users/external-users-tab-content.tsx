import { IconBarrierBlock } from '@tabler/icons-react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function ExternalUsersTabContent() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBarrierBlock />
        </EmptyMedia>
        <EmptyTitle>Usuarios externos</EmptyTitle>
        <EmptyDescription>Administrar usuarios externos.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        Esta sección está en desarrollo. Pronto podrás administrar usuarios externos desde aquí.
      </EmptyContent>
    </Empty>
  )
}

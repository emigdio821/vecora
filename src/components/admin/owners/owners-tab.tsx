import { IconBug } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { ownersListQueryOptions } from '@/lib/ts-queries/owners'
import { OwnersDataTable } from './data-table'

export function OwnersTab() {
  const { data: owners, isLoading, error, refetch } = useQuery(ownersListQueryOptions())

  if (error) {
    return (
      <Empty>
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

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-full sm:w-sm" />

        <div className="mt-4 flex w-full flex-col gap-2 rounded-lg border border-transparent">
          <Skeleton className="h-2 w-2/4 sm:w-1/2" />
          <Skeleton className="h-2 w-3/4 sm:w-2/3" />
          <Skeleton className="h-2 w-4/4 sm:w-3/4" />
        </div>
      </div>
    )
  }

  return <OwnersDataTable data={owners || []} />
}

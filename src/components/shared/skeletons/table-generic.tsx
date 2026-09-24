import { Skeleton } from '@/components/ui/skeleton'
import { TextGenericSkeleton } from './text-generic'

interface TableGenericSkeletonProps {
  withHeader?: boolean
  headerContent?: React.ReactNode
}

export function TableGenericSkeleton({ withHeader = true, headerContent }: TableGenericSkeletonProps) {
  return (
    <div className="flex flex-col gap-4" data-slot="table-generic-skeleton">
      {withHeader && (
        <div>
          {headerContent ? (
            headerContent
          ) : (
            <Skeleton className="h-8 w-full rounded-lg sm:w-2xs md:w-xs xl:w-sm" />
          )}
        </div>
      )}

      <TextGenericSkeleton />
    </div>
  )
}

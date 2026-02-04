import { Skeleton } from '@/components/ui/skeleton'

interface TableGenericSkeletonProps {
  withHeader?: boolean
  headerContent?: React.ReactNode
}

export function TableGenericSkeleton({ withHeader = true, headerContent }: TableGenericSkeletonProps) {
  return (
    <div className="space-y-2">
      {withHeader && (
        <div>{headerContent ? headerContent : <Skeleton className="h-8 w-full rounded-lg sm:w-sm" />}</div>
      )}

      <div className="flex w-full flex-col gap-2 rounded-lg border border-transparent pt-0">
        <Skeleton className="h-2 w-2/4 sm:w-1/2" />
        <Skeleton className="h-2 w-3/4 sm:w-2/3" />
        <Skeleton className="h-2 w-4/4 sm:w-3/4" />
      </div>
    </div>
  )
}

import { Frame, FrameHeader } from '@/components/ui/frame'
import { Skeleton } from '@/components/ui/skeleton'

interface TableGenericSkeletonProps {
  withHeader?: boolean
}

export function TableGenericSkeleton({ withHeader = true }: TableGenericSkeletonProps) {
  return (
    <Frame className="w-full">
      {withHeader && (
        <FrameHeader className="p-2">
          <Skeleton className="h-8 w-full rounded-lg sm:w-sm" />
        </FrameHeader>
      )}

      <div className="flex w-full flex-col gap-2 rounded-lg border border-transparent p-2 pt-0">
        <Skeleton className="h-2 w-2/4 sm:w-1/2" />
        <Skeleton className="h-2 w-3/4 sm:w-2/3" />
        <Skeleton className="h-2 w-4/4 sm:w-3/4" />
      </div>
    </Frame>
  )
}

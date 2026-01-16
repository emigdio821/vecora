import { Skeleton } from '@/components/ui/skeleton'

export function TableGenericSkeleton() {
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

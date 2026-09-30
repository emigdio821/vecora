import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { Skeleton } from '@/components/ui/skeleton'

// Prefetched with every link, so a click lands here at once (sidebar and
// header stay) while the page renders on the server.
export default function AuthedLoading() {
  return (
    <>
      <Skeleton className="h-6 w-32" />

      <TableGenericSkeleton />
    </>
  )
}

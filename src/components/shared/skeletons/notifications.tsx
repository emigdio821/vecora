import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const NOTIF_COUNT = 4

interface NotificationsSkeletonProps {
  count?: number
}

export function NotificationsSkeleton({ count = NOTIF_COUNT }: NotificationsSkeletonProps) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-4">
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: not applicable in this case since it's a static skeleton
        <Card key={index} className="mb-2 break-inside-avoid">
          <CardHeader>
            <Skeleton className="mb-2 h-5 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-2 w-2/4" />
              <Skeleton className="h-2 w-3/4" />
            </div>
          </CardHeader>

          <CardFooter className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-2 w-2/4" />
              <Skeleton className="h-2 w-2/4" />
            </div>
            <Skeleton className="h-5 w-1/5 rounded-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

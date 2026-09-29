import { Card, CardFrame, CardFrameHeader, CardPanel } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface CardFrameSkeletonProps {
  /**
   * List rows to sketch in the panel. Omit for a single value placeholder
   * (the dashboard money cards).
   */
  rows?: number
  className?: string
}

/**
 * Loading state that keeps the CardFrame chrome (header + inner card) so the
 * page doesn't jump when the data lands; only the text turns into bars.
 */
export function CardFrameSkeleton({ rows, className }: CardFrameSkeletonProps) {
  return (
    <CardFrame className={className} aria-busy data-slot="card-frame-skeleton">
      <CardFrameHeader className="grid-cols-[1fr_auto]">
        <div className="grid gap-2 py-0.5">
          <Skeleton className="h-3.5 w-28 max-w-full" />
          <Skeleton className="h-3.5 w-36 max-w-full" />
        </div>
        <Skeleton className="col-start-2 row-span-2 row-start-1 size-6 self-center rounded-full" />
      </CardFrameHeader>
      <Card>
        <CardPanel className="px-0">
          {rows === undefined ? (
            <Skeleton className="mx-6 h-8 w-32 max-w-full" />
          ) : (
            <ul className="flex flex-col divide-y">
              {Array.from({ length: rows }, (_, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-4 px-6 py-3 first:pt-0 last:pb-0"
                >
                  <div className="grid flex-1 gap-2 py-0.5">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-5 w-20 shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}

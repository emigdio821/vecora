import { CardPanel } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CardFrameSkeleton } from './card-frame'

// The dashboard's list cards share one panel height, whatever they hold (a few rows,
// many that scroll, or the empty state), so their skeleton is exactly as tall.

/** The card's panel: always this tall (flex-none: CardPanel's flex-1 would size it to its rows). */
export const CARD_LIST_PANEL_CLASS = 'h-56 flex-none p-0'
/** The rows; the panel scrolls them once they don't fit. */
export const CARD_LIST_CLASS = 'flex h-full flex-col divide-y overflow-y-auto'
/** Each row: the first and last with more room, like a panel's padding. */
export const CARD_LIST_ROW_CLASS = 'grid gap-1 px-6 py-3 first:pt-6 last:pb-6'
/** The empty state, with less room around it than Empty's default so it fits the panel. */
export const CARD_LIST_EMPTY_CLASS = 'h-full py-6 md:py-6'

interface CardListSkeletonProps {
  rows: number
  /** One row's bars, laid out like the card's own rows. */
  row: React.ReactNode
}

/** Loading state for the dashboard's list cards: their panel, with each card's row as bars. */
export function CardListSkeleton({ rows, row }: CardListSkeletonProps) {
  return (
    <CardFrameSkeleton className="w-full">
      <CardPanel className={CARD_LIST_PANEL_CLASS}>
        <ul className={cn(CARD_LIST_CLASS, 'overflow-hidden')}>
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className={CARD_LIST_ROW_CLASS}>
              {row}
            </li>
          ))}
        </ul>
      </CardPanel>
    </CardFrameSkeleton>
  )
}

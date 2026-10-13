import { CardPanel } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CardFrameSkeleton } from './card-frame'

// The dashboard's list cards share one panel height, whatever they hold (a few rows,
// many that scroll, or the empty state), so their skeleton is exactly as tall.

/**
 * The card's panel: two one-line rows tall (2 x 76px plus the divider); the rest scroll.
 * A card whose rows stack on phones sets its own phone height. flex-none: CardPanel's
 * flex-1 would size it to its rows.
 */
export const CARD_LIST_PANEL_CLASS = 'h-38.25 flex-none p-0'
/** The rows; the panel scrolls them once they don't fit. */
export const CARD_LIST_CLASS = 'flex h-full flex-col divide-y overflow-y-auto'
/** Each row: the first and last with more room, like a panel's padding. */
export const CARD_LIST_ROW_CLASS = 'grid gap-1 px-6 py-3 first:pt-6 last:pb-6'
/** The empty state: its own height is about all the panel has, so no padding around it. */
export const CARD_LIST_EMPTY_CLASS = 'h-full py-0 md:py-0'

interface CardListSkeletonProps {
  rows: number
  /** One row's bars, laid out like the card's own rows. */
  row: React.ReactNode
  /** The card's own panel height, when it isn't the shared one. */
  panelClassName?: string
}

/** Loading state for the dashboard's list cards: their panel, with each card's row as bars. */
export function CardListSkeleton({ rows, row, panelClassName }: CardListSkeletonProps) {
  return (
    <CardFrameSkeleton className="w-full">
      <CardPanel className={cn(CARD_LIST_PANEL_CLASS, panelClassName)}>
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

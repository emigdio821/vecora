import { ParaglideMessage } from '@inlang/paraglide-js-react'
import { IconAlertCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { messageMarkup } from '@/components/shared/message-markup'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { periodFor } from '@/lib/periods'
import { m } from '@/paraglide/messages'
import { periodsQueryOptions } from '@/tanstack-queries/presidency'

/**
 * No period covers `day` ("YYYY-MM-DD"), so saving a movement on it would fail.
 * False while the periods load, or if they failed to: saving still checks.
 */
export function useIsPeriodMissing(day: string): boolean {
  const { data: periods } = useQuery(periodsQueryOptions)
  if (!periods) return false
  return !periodFor(periods, day)
}

/** Shown with the submit button disabled, while `useIsPeriodMissing` is true. */
export function NoPeriodAlert() {
  return (
    <Alert variant="warning">
      <IconAlertCircle />
      <AlertTitle>{m.common_no_period()}</AlertTitle>
      <AlertDescription>
        {/* One paragraph: the description is a flex column, which would stack each part. */}
        <p>
          <ParaglideMessage markup={messageMarkup} message={m.common_no_period_description} />
        </p>
      </AlertDescription>
    </Alert>
  )
}

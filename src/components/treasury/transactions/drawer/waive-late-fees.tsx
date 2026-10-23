import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckboxGroup } from '@/components/ui/checkbox-group'
import { Label } from '@/components/ui/label'
import { formatMonth } from '@/lib/utils'
import { m } from '@/paraglide/messages'

interface WaiveLateFeesProps {
  /** The receipt's months paid after the due day, oldest first. */
  lateMonths: string[]
  dueDay: number
  /** The late months whose late fee is forgiven. */
  value: string[]
  onValueChange: (value: string[]) => void
  disabled?: boolean
}

/**
 * The board can forgive the late fee of some months and not others: one checkbox per
 * late month, and one on top for all of them (coss particles p-checkbox-4 and
 * p-checkbox-group-3). With a single late month, just its checkbox.
 */
export function WaiveLateFees({ lateMonths, dueDay, value, onValueChange, disabled }: WaiveLateFeesProps) {
  const captionId = useId()

  const description = (
    <p className="text-xs text-muted-foreground">
      {m.treasury_waive_late_fee_description({ count: lateMonths.length, dueDay })}
    </p>
  )

  if (lateMonths.length === 1) {
    const [month] = lateMonths
    return (
      <Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
        <Checkbox
          checked={value.includes(month)}
          onCheckedChange={(checked) => {
            onValueChange(checked ? [month] : [])
          }}
          disabled={disabled}
        />
        <div className="flex flex-col gap-1">
          <p>{m.treasury_waive_late_fee()}</p>
          {description}
        </div>
      </Label>
    )
  }

  return (
    <CheckboxGroup
      aria-labelledby={captionId}
      allValues={lateMonths}
      value={value}
      onValueChange={(next) => {
        // In the receipt's order, whichever was ticked first.
        onValueChange(lateMonths.filter((month) => next.includes(month)))
      }}
      disabled={disabled}
      className="rounded-lg border p-3 has-data-checked:border-primary/48 has-data-checked:bg-accent/50"
    >
      <Label id={captionId} className="flex items-start gap-2">
        <Checkbox parent />
        <div className="flex flex-col gap-1">
          <p>{m.treasury_waive_late_fees()}</p>
          {description}
        </div>
      </Label>
      {lateMonths.map((month) => (
        <Label key={month} className="ms-6 flex items-center gap-2 font-normal">
          <Checkbox value={month} />
          {formatMonth(month)}
        </Label>
      ))}
    </CheckboxGroup>
  )
}

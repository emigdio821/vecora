import { IconInfoCircle, IconSelector } from '@tabler/icons-react'
import { addDays, addYears, format, parseISO, subYears } from 'date-fns'
import { useId, useState } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldGroup, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { useToday } from '@/hooks/use-today'
import { type CurrencyCode, currencySymbol, formatDay, intlLocale, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import type { PeriodInput } from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'

interface PeriodFormFieldsProps {
  form: UseFormReturn<PeriodInput>
  /** Of the fees: the HOA's current one for a new period, the period's own when editing. */
  currency: CurrencyCode
  disabled?: boolean
  /** Editing a period that already has movements: rates only apply going forward. */
  inUse?: boolean
}

/** Shared by the create and edit drawers. */
export function PeriodFormFields({ form, currency, disabled, inUse }: PeriodFormFieldsProps) {
  const [openDate, setOpenDate] = useState<'starts_on' | 'ends_on' | null>(null)
  // The triggers are plain buttons, so Field can't link the labels to them on its own.
  // Each name is its label plus the picked date, which would otherwise go unread.
  const dateTriggerId = useId()
  const startsOn = useWatch({ control: form.control, name: 'starts_on' })
  const today = useToday()

  return (
    <>
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              {m.common_field_name()} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} autoComplete="off" disabled={disabled} />
            <FieldDescription>{m.presidency_period_name_description()}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {(['starts_on', 'ends_on'] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel id={`${dateTriggerId}-${name}-label`} htmlFor={`${dateTriggerId}-${name}`}>
                  {name === 'starts_on' ? m.presidency_period_starts_on() : m.presidency_period_ends_on()}{' '}
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Popover
                  open={openDate === name}
                  onOpenChange={(open) => {
                    setOpenDate(open ? name : null)
                  }}
                >
                  <PopoverTrigger
                    id={`${dateTriggerId}-${name}`}
                    aria-labelledby={`${dateTriggerId}-${name}-label ${dateTriggerId}-${name}-value`}
                    ref={field.ref}
                    render={
                      <Button
                        variant="outline"
                        aria-invalid={fieldState.invalid}
                        disabled={disabled}
                        className="w-full justify-between pr-2"
                      >
                        <span id={`${dateTriggerId}-${name}-value`} className="truncate font-normal">
                          {formatDay(field.value)}
                        </span>
                        <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                      </Button>
                    }
                  />
                  <PopoverPopup className="w-auto p-1">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={subYears(today, 5)}
                      endMonth={addYears(today, 5)}
                      selected={parseISO(field.value)}
                      defaultMonth={parseISO(field.value)}
                      // The end must come after the start (same rule as the schema).
                      disabled={name === 'ends_on' ? { before: addDays(parseISO(startsOn), 1) } : undefined}
                      onSelect={(date) => {
                        field.onChange(format(date ?? new Date(), ISO_DAY))
                        setOpenDate(null)
                      }}
                    />
                  </PopoverPopup>
                </Popover>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="monthly_fee"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
            >
              <FieldLabel>
                {m.presidency_period_monthly_fee()} <span className="text-destructive">*</span>
              </FieldLabel>
              <InputGroup>
                <NumberField
                  value={field.value ?? null}
                  onValueChange={(value) => {
                    field.onChange(value)
                  }}
                  min={0}
                  locale={intlLocale()}
                  format={MONEY_FORMAT}
                  disabled={disabled}
                >
                  <NumberFieldInput ref={field.ref} className="text-left" inputMode="decimal" />
                </NumberField>
                <InputGroupAddon>
                  <InputGroupText>{currencySymbol(currency)}</InputGroupText>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{currency}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        <Controller
          name="late_fee"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
            >
              <FieldLabel>
                {m.presidency_period_late_fee()} <span className="text-destructive">*</span>
              </FieldLabel>
              <InputGroup>
                <NumberField
                  value={field.value ?? null}
                  onValueChange={(value) => {
                    field.onChange(value)
                  }}
                  min={0}
                  locale={intlLocale()}
                  format={MONEY_FORMAT}
                  disabled={disabled}
                >
                  <NumberFieldInput ref={field.ref} className="text-left" inputMode="decimal" />
                </NumberField>
                <InputGroupAddon>
                  <InputGroupText>{currencySymbol(currency)}</InputGroupText>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{currency}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
      </div>

      <Controller
        name="due_day"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              {m.presidency_period_due_day()} <span className="text-destructive">*</span>
            </FieldLabel>
            <NumberField
              value={field.value ?? null}
              onValueChange={(value) => {
                field.onChange(value)
              }}
              min={1}
              max={28}
              step={1}
              disabled={disabled}
            >
              <NumberFieldGroup>
                <NumberFieldInput ref={field.ref} className="text-left" inputMode="numeric" />
              </NumberFieldGroup>
            </NumberField>
            <FieldDescription>{m.presidency_period_due_day_description()}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {inUse && (
        <Alert variant="info">
          <IconInfoCircle />
          <AlertTitle>{m.presidency_period_in_use_title()}</AlertTitle>
          <AlertDescription>{m.presidency_period_in_use_description()}</AlertDescription>
        </Alert>
      )}
    </>
  )
}

import { IconAlertTriangle, IconSelector } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { addYears, format, parseISO, startOfToday } from 'date-fns'
import { useId, useMemo, useState } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { HousesPicker } from '@/components/shared/pickers/houses-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToday } from '@/hooks/use-today'
import {
  type CurrencyCode,
  currencySymbol,
  formatDay,
  formatMonth,
  intlLocale,
  ISO_DAY,
  MONEY_FORMAT,
} from '@/lib/utils'
import type { ReservationInput } from '@/lib/validations/presidency'
import { m } from '@/paraglide/messages'
import { amenitiesQueryOptions, reservationsQueryOptions } from '@/tanstack-queries/presidency'
import { houseFeeStatusQueryOptions } from '@/tanstack-queries/treasury'

interface ReservationFormFieldsProps {
  form: UseFormReturn<ReservationInput>
  /** Of the amount: the HOA's current one for a new booking, the booking's own when editing. */
  currency: CurrencyCode
  disabled?: boolean
  /** Editing: this booking's own day must stay selectable. */
  currentId?: string
  /** Editing a paid booking: the ledger already has its area, house and amount. */
  lockPaidFields?: boolean
}

/** Shared by the create and edit drawers. */
export function ReservationFormFields({
  form,
  currency,
  disabled,
  currentId,
  lockPaidFields,
}: ReservationFormFieldsProps) {
  const [isDateOpen, setDateOpen] = useState(false)
  const today = useToday()
  const { data: amenities } = useQuery(amenitiesQueryOptions())
  const { data: reservations } = useQuery(reservationsQueryOptions())
  const { data: feeStatus } = useQuery(houseFeeStatusQueryOptions())
  const amenityId = useWatch({ control: form.control, name: 'amenity_id' })
  const propertyId = useWatch({ control: form.control, name: 'property_id' })
  const amount = useWatch({ control: form.control, name: 'amount' })
  const feeSwitchId = useId()

  // Retired areas leave the list, except the one this booking already has.
  const initialAmenityId = form.formState.defaultValues?.amenity_id
  const amenityItems = useMemo(
    () =>
      (amenities ?? [])
        .filter((a) => a.is_active || a.id === initialAmenityId)
        .map((a) => ({ value: a.id, label: a.name })),
    [amenities, initialAmenityId],
  )
  const amenity = amenities?.find((a) => a.id === amenityId)

  // Most areas are free; some bookings carry a charge (e.g. electricity for
  // brincolines). Empty while switched on still counts as on, so the fee
  // field stays visible.
  const hasFee = amount !== 0

  // Days this area is already booked by someone else are greyed out; the DB
  // enforces it too (unique area + day), this just saves a failed submit.
  // Cancelled bookings no longer hold their day.
  const takenDays = useMemo(
    () =>
      (reservations ?? [])
        .filter((r) => r.id !== currentId && r.amenity.id === amenityId && !r.cancelled_at)
        .map((r) => parseISO(r.reserved_on)),
    [reservations, currentId, amenityId],
  )

  // A warning only: the board doesn't block a booking over missing fees. Once
  // paid the house is settled, so there's nothing left to warn about.
  const unpaidMonths = lockPaidFields
    ? []
    : (feeStatus?.find((h) => h.property_id === propertyId)?.unpaid_months ?? [])

  return (
    <>
      <Controller
        name="amenity_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              {m.presidency_amenity()} <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              items={amenityItems}
              value={field.value || null}
              onValueChange={(value) => {
                field.onChange(value ?? '')
                // Each area proposes its own fee.
                const next = amenities?.find((a) => a.id === value)
                if (next) form.setValue('amount', Number(next.default_fee), { shouldDirty: true })
              }}
              disabled={disabled || lockPaidFields}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={m.presidency_select_amenity()} />
              </SelectTrigger>
              <SelectPopup>
                {amenityItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        name="property_id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              {m.common_field_house()} <span className="text-destructive">*</span>
            </FieldLabel>
            <HousesPicker
              value={field.value || null}
              onValueChange={(value) => {
                field.onChange(value ?? '')
              }}
              inputRef={field.ref}
              disabled={disabled || lockPaidFields}
            />
            <FieldDescription>{m.presidency_reservation_house_description()}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {unpaidMonths.length > 0 && (
        <Alert variant="warning">
          <IconAlertTriangle />
          <AlertTitle>{m.presidency_unpaid_fees_title()}</AlertTitle>
          <AlertDescription>
            {m.presidency_unpaid_fees_description({
              count: unpaidMonths.length,
              months: unpaidMonths.map((month) => formatMonth(month)).join(', '),
            })}
          </AlertDescription>
        </Alert>
      )}

      <Controller
        name="reserved_on"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              {m.common_field_date()} <span className="text-destructive">*</span>
            </FieldLabel>
            <Popover open={isDateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                ref={field.ref}
                render={
                  <Button
                    variant="outline"
                    aria-invalid={fieldState.invalid}
                    disabled={disabled}
                    className="w-full justify-between pr-2"
                  >
                    <span className="truncate font-normal">{formatDay(field.value)}</span>
                    <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                  </Button>
                }
              />
              <PopoverPopup className="w-auto p-1">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  startMonth={startOfToday()}
                  endMonth={addYears(today, 1)}
                  selected={parseISO(field.value)}
                  defaultMonth={parseISO(field.value)}
                  disabled={[{ before: startOfToday() }, ...takenDays]}
                  onSelect={(date) => {
                    field.onChange(format(date ?? new Date(), ISO_DAY))
                    setDateOpen(false)
                  }}
                />
              </PopoverPopup>
            </Popover>
            <FieldDescription>{m.presidency_reservation_date_description()}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <div className="flex items-start gap-2">
        <Switch
          id={feeSwitchId}
          checked={hasFee}
          onCheckedChange={(checked) => {
            // Off means free; on starts from the area's fee, or empty to force one.
            const defaultFee = Number(amenity?.default_fee ?? 0)
            form.setValue('amount', checked ? defaultFee || (null as unknown as number) : 0, {
              shouldDirty: true,
            })
          }}
          disabled={disabled || lockPaidFields}
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor={feeSwitchId}>{m.presidency_add_fee()}</Label>
          <p className="text-xs text-muted-foreground">{m.presidency_add_fee_description()}</p>
        </div>
      </div>

      {hasFee && (
        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
            >
              <FieldLabel>
                {m.presidency_fee()} <span className="text-destructive">*</span>
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
                  disabled={disabled || lockPaidFields}
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
              <FieldDescription>{m.presidency_fee_description()}</FieldDescription>
              <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
      )}

      <Controller
        name="notes"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>{m.common_field_notes()}</FieldLabel>
            <Textarea {...field} rows={3} className="max-h-40" disabled={disabled} />
            <FieldDescription>{m.presidency_reservation_notes_description()}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

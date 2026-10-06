import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconSelector } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addMonths,
  addYears,
  eachMonthOfInterval,
  format,
  isAfter,
  parseISO,
  setDate,
  startOfMonth,
  subMonths,
  subYears,
} from 'date-fns'
import { useId, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { HousesPicker, houseLabel } from '@/components/shared/pickers/houses-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from '@/components/ui/combobox'
import type { DrawerPrimitive } from '@/components/ui/drawer'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { useCurrency, useFormatCurrency } from '@/hooks/use-currency'
import { useToday } from '@/hooks/use-today'
import { formatDay, formatMonth, ISO_DAY } from '@/lib/utils'
import { type RecordFeePaymentInput, recordFeePaymentSchema } from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'
import { recordFeePayment } from '@/server-actions/treasury'
import { housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { periodsQueryOptions, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { PAYMENT_METHOD_ITEMS } from '../../kind'

const FORM_ID = 'record-fee-form'

// A year back (catching up) and a year ahead (paying in advance), as "YYYY-MM-01".
const MONTH_OPTIONS = eachMonthOfInterval({
  start: subMonths(startOfMonth(new Date()), 12),
  end: addMonths(startOfMonth(new Date()), 12),
}).map((month) => format(month, ISO_DAY))

function defaultValues(): RecordFeePaymentInput {
  return {
    property_id: '',
    fee_months: [format(startOfMonth(new Date()), ISO_DAY)],
    occurred_on: format(new Date(), ISO_DAY),
    payment_method: 'cash',
    folio: '',
    reference: '',
    notes: '',
    waive_late_fee: false,
  }
}

interface RecordFeeDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordFeeDrawer({ open, onOpenChange, ...props }: RecordFeeDrawerProps) {
  const queryClient = useQueryClient()
  const waiveSwitchId = useId()
  const [isDateOpen, setDateOpen] = useState(false)
  const dateTriggerId = useId()
  const today = useToday()
  const { data: periods } = useQuery(periodsQueryOptions())
  const home = useCurrency()
  const formatCurrency = useFormatCurrency()

  const form = useForm<RecordFeePaymentInput>({
    resolver: zodResolver(recordFeePaymentSchema),
    defaultValues: defaultValues(),
  })
  const [feeMonths, occurredOn, paymentMethod, waiveLateFee] = useWatch({
    control: form.control,
    name: ['fee_months', 'occurred_on', 'payment_method', 'waive_late_fee'],
  })

  // Mirror of the RPC's rules, so the treasurer sees the total before saving.
  const preview = useMemo(() => {
    const period = periods?.find((p) => p.starts_on <= occurredOn && occurredOn <= p.ends_on)
    if (!period) return null

    const paidOn = parseISO(occurredOn)
    const lateMonths = feeMonths.filter((month) => isAfter(paidOn, setDate(parseISO(month), period.due_day)))
    const lateFees = waiveLateFee ? 0 : lateMonths.length * Number(period.late_fee)

    return {
      period,
      lateMonths: lateMonths.length,
      fees: feeMonths.length * Number(period.monthly_fee),
      lateFees,
      total: feeMonths.length * Number(period.monthly_fee) + lateFees,
    }
  }, [periods, feeMonths, occurredOn, waiveLateFee])

  const mutation = useMutation({
    mutationFn: async (values: RecordFeePaymentInput) => {
      const result = await recordFeePayment(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (summary, values) => {
      const house = queryClient
        .getQueryData(housesPickerQueryOptions().queryKey)
        ?.find((h) => h.id === values.property_id)

      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })

      const description = {
        house: house ? houseLabel(house) : m.common_field_house(),
        months: m.treasury_months_count({ count: summary.fee_count }),
        // The RPC charges in the currency of the period the payment date falls in.
        total: formatCurrency(summary.total, preview?.period.currency ?? home),
        folio: values.folio,
      }
      toastManager.add({
        type: 'success',
        title: m.treasury_fee_recorded(),
        description:
          summary.late_fee_count > 0
            ? m.treasury_fee_recorded_description_late(description)
            : m.treasury_fee_recorded_description(description),
      })
      onOpenChange(false)
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    props.onOpenChangeComplete?.(isOpen)

    if (!isOpen) {
      form.reset(defaultValues())
    }
  }

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.treasury_record_fee()}</DrawerTitle>
          <DrawerDescription>{m.treasury_record_fee_description()}</DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
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
                    disabled={mutation.isPending}
                  />
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="fee_months"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    {m.treasury_fee_months()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Combobox
                    multiple
                    items={MONTH_OPTIONS}
                    itemToStringLabel={formatMonth}
                    value={field.value}
                    onValueChange={(value: string[]) => {
                      field.onChange([...value].sort())
                    }}
                    inputRef={field.ref}
                    disabled={mutation.isPending}
                  >
                    <ComboboxChips>
                      <ComboboxValue>
                        {(value: string[]) => (
                          <>
                            {value.map((month) => (
                              <ComboboxChip
                                key={month}
                                aria-label={formatMonth(month)}
                                removeProps={{ 'aria-label': m.common_action_remove() }}
                              >
                                {formatMonth(month)}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              placeholder={value.length > 0 ? undefined : m.treasury_search_month()}
                            />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxPopup>
                      <ComboboxEmpty>{m.common_no_results()}</ComboboxEmpty>
                      <ComboboxList>
                        {(month: string) => (
                          <ComboboxItem key={month} value={month}>
                            {formatMonth(month)}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxPopup>
                  </Combobox>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="occurred_on"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    name={field.name}
                    invalid={fieldState.invalid}
                    touched={fieldState.isTouched}
                    dirty={fieldState.isDirty}
                  >
                    <FieldLabel id={`${dateTriggerId}-label`} htmlFor={dateTriggerId}>
                      {m.treasury_payment_date()} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Popover open={isDateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger
                        id={dateTriggerId}
                        aria-labelledby={`${dateTriggerId}-label ${dateTriggerId}-value`}
                        ref={field.ref}
                        render={
                          <Button
                            variant="outline"
                            aria-invalid={fieldState.invalid}
                            disabled={mutation.isPending}
                            className="w-full justify-between pr-2"
                          >
                            <span id={`${dateTriggerId}-value`} className="truncate font-normal">
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
                          endMonth={addYears(today, 1)}
                          selected={parseISO(field.value)}
                          defaultMonth={parseISO(field.value)}
                          onSelect={(date) => {
                            field.onChange(format(date ?? new Date(), ISO_DAY))
                            setDateOpen(false)
                          }}
                        />
                      </PopoverPopup>
                    </Popover>
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="folio"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    name={field.name}
                    invalid={fieldState.invalid}
                    touched={fieldState.isTouched}
                    dirty={fieldState.isDirty}
                  >
                    <FieldLabel>
                      {m.treasury_receipt_folio()} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </div>

            <Controller
              name="payment_method"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    {m.common_field_payment_method()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    items={PAYMENT_METHOD_ITEMS}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {PAYMENT_METHOD_ITEMS.map((item) => (
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

            {paymentMethod === 'transfer' && (
              <Controller
                name="reference"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    name={field.name}
                    invalid={fieldState.invalid}
                    touched={fieldState.isTouched}
                    dirty={fieldState.isDirty}
                  >
                    <FieldLabel>
                      {m.treasury_transfer_reference()} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                    <FieldDescription>{m.treasury_transfer_reference_description()}</FieldDescription>
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            )}

            {preview && preview.lateMonths > 0 && (
              <Controller
                name="waive_late_fee"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-start gap-2">
                    <Switch
                      id={waiveSwitchId}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={mutation.isPending}
                    />
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={waiveSwitchId}>{m.treasury_waive_late_fee()}</Label>
                      <p className="text-xs text-muted-foreground">
                        {m.treasury_waive_late_fee_description({
                          count: preview.lateMonths,
                          dueDay: preview.period.due_day,
                        })}
                      </p>
                    </div>
                  </div>
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
                  <Textarea {...field} rows={3} className="max-h-40" disabled={mutation.isPending} />
                  <FieldDescription>{m.treasury_fee_notes_description()}</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {preview ? (
              <Alert>
                <AlertTitle>{m.treasury_period_label({ name: preview.period.name })}</AlertTitle>
                <AlertDescription>
                  <dl className="grid grid-cols-[1fr_auto] gap-x-4 text-sm tabular-nums">
                    <dt className="text-muted-foreground">
                      {m.treasury_fees_of({
                        count: feeMonths.length,
                        amount: formatCurrency(preview.period.monthly_fee, preview.period.currency),
                      })}
                    </dt>
                    <dd className="text-right">{formatCurrency(preview.fees, preview.period.currency)}</dd>
                    {preview.lateMonths > 0 && (
                      <>
                        <dt className="text-muted-foreground">
                          {m.treasury_late_fees_of({
                            count: preview.lateMonths,
                            amount: formatCurrency(preview.period.late_fee, preview.period.currency),
                          })}
                          {waiveLateFee && ` ${m.treasury_waived()}`}
                        </dt>
                        <dd className="text-right">
                          {formatCurrency(preview.lateFees, preview.period.currency)}
                        </dd>
                      </>
                    )}
                    <dt className="font-medium">{m.treasury_total_to_receive()}</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatCurrency(preview.total, preview.period.currency)}
                    </dd>
                  </dl>
                </AlertDescription>
              </Alert>
            ) : (
              periods && (
                <Alert variant="warning">
                  <IconAlertCircle />
                  <AlertTitle>{m.treasury_no_period()}</AlertTitle>
                  <AlertDescription>{m.treasury_no_period_description()}</AlertDescription>
                </Alert>
              )
            )}

            {form.formState.errors.root && (
              <Alert variant="error">
                <IconAlertCircle />
                <AlertTitle>{m.common_error()}</AlertTitle>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            {m.common_action_cancel()}
          </DrawerClose>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={mutation.isPending || !preview}
            loading={mutation.isPending}
          >
            {m.treasury_record()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

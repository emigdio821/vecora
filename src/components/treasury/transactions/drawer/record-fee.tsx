import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconSelector } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, isAfter, parseISO, setDate, startOfMonth } from 'date-fns'
import { Fragment, useId, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { NoPeriodAlert } from '@/components/shared/no-period-alert'
import { PeriodCalendar } from '@/components/shared/period-calendar'
import { HousesPicker, houseLabel } from '@/components/shared/pickers/houses-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxSeparator,
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
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { useCurrency, useFormatCurrency } from '@/hooks/use-currency'
import { type FeeMonthGroup, feeMonthsByPeriod, periodFor } from '@/lib/periods'
import { formatDay, formatMonth, ISO_DAY } from '@/lib/utils'
import { type RecordFeePaymentInput, recordFeePaymentSchema } from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'
import { recordFeePayment } from '@/server-actions/treasury'
import { housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { PRESIDENCY_QUERY_KEY, periodsQueryOptions } from '@/tanstack-queries/presidency'
import { TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { PAYMENT_METHOD_ITEMS } from '../../kind'
import { WaiveLateFees } from './waive-late-fees'

const FORM_ID = 'record-fee-form'

function defaultValues(): RecordFeePaymentInput {
  return {
    propertyId: '',
    feeMonths: [format(startOfMonth(new Date()), ISO_DAY)],
    occurredOn: format(new Date(), ISO_DAY),
    paymentMethod: 'cash',
    folio: '',
    reference: '',
    notes: '',
    waivedMonths: [],
  }
}

/** The months paid after the period's due day: the service's rule, so the drawer can show it. */
function lateMonthsOf(period: { dueDay: number }, feeMonths: string[], occurredOn: string): string[] {
  const paidOn = parseISO(occurredOn)
  return feeMonths.filter((month) => isAfter(paidOn, setDate(parseISO(month), period.dueDay)))
}

interface RecordFeeDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordFeeDrawer({ open, onOpenChange, ...props }: RecordFeeDrawerProps) {
  const queryClient = useQueryClient()
  const [isDateOpen, setDateOpen] = useState(false)
  const dateTriggerId = useId()
  const { data: periods } = useQuery(periodsQueryOptions)
  const home = useCurrency()
  const formatCurrency = useFormatCurrency()
  // Catching up and paying in advance alike: any month a period covers, newest period first.
  const monthGroups = useMemo(() => feeMonthsByPeriod(periods ?? []), [periods])

  const form = useForm<RecordFeePaymentInput>({
    resolver: zodResolver(recordFeePaymentSchema),
    defaultValues: defaultValues(),
  })
  const [feeMonths, occurredOn, paymentMethod, waivedMonths] = useWatch({
    control: form.control,
    name: ['feeMonths', 'occurredOn', 'paymentMethod', 'waivedMonths'],
  })

  // Mirror of the service's rules, so the treasurer sees the total before saving.
  const preview = useMemo(() => {
    const period = periods ? periodFor(periods, occurredOn) : undefined
    if (!period) return null

    const lateMonths = lateMonthsOf(period, feeMonths, occurredOn)
    const waivedCount = lateMonths.filter((month) => waivedMonths.includes(month)).length
    const lateFees = (lateMonths.length - waivedCount) * period.lateFee

    return {
      period,
      lateMonths,
      waivedCount,
      fees: feeMonths.length * period.monthlyFee,
      lateFees,
      total: feeMonths.length * period.monthlyFee + lateFees,
    }
  }, [periods, feeMonths, occurredOn, waivedMonths])

  /**
   * Keeps only the waived months that are still late with these months and this date:
   * one dropped and picked again (or late again after a date change) starts charged.
   */
  function keepLateWaivedMonths(nextFeeMonths: string[], nextOccurredOn: string) {
    const period = periods ? periodFor(periods, nextOccurredOn) : undefined
    const lateMonths = period ? lateMonthsOf(period, nextFeeMonths, nextOccurredOn) : []
    const current = form.getValues('waivedMonths')
    form.setValue(
      'waivedMonths',
      current.filter((month) => lateMonths.includes(month)),
    )
  }

  const mutation = useMutation({
    mutationFn: async (values: RecordFeePaymentInput) => {
      const result = await recordFeePayment(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (summary, values) => {
      const house = queryClient
        .getQueryData(housesPickerQueryOptions.queryKey)
        ?.find((h) => h.id === values.propertyId)

      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      // Each period counts its movements; any at all blocks deleting it.
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY, 'periods'] })

      const description = {
        house: house ? houseLabel(house) : m.common_field_house(),
        months: m.treasury_months_count({ count: summary.feeCount }),
        // The service charges in the currency of the period the payment date falls in.
        total: formatCurrency(summary.total, preview?.period.currency ?? home),
        folio: values.folio,
      }
      let toastDescription = m.treasury_fee_recorded_description(description)
      if (summary.lateFeeCount === summary.feeCount) {
        toastDescription = m.treasury_fee_recorded_description_late(description)
      } else if (summary.lateFeeCount > 0) {
        // Some months were on time or waived: say how many carried a late fee.
        toastDescription = m.treasury_fee_recorded_description_some_late({
          ...description,
          lateFees: summary.lateFeeCount,
        })
      }
      toastManager.add({
        type: 'success',
        title: m.treasury_fee_recorded(),
        description: toastDescription,
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
      mutation.reset()
    }
  }

  // Still busy after a save, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      {...props}
    >
      <DrawerPopup>
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
              name="propertyId"
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
                    disabled={isBusy}
                  />
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="feeMonths"
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
                    items={monthGroups}
                    itemToStringLabel={formatMonth}
                    value={field.value}
                    onValueChange={(value: string[]) => {
                      const sorted = [...value].sort()
                      field.onChange(sorted)
                      keepLateWaivedMonths(sorted, occurredOn)
                    }}
                    inputRef={field.ref}
                    disabled={isBusy}
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
                      <ComboboxEmpty>
                        {periods?.length === 0 ? m.common_no_periods() : m.common_no_results()}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {(group: FeeMonthGroup) => (
                          <Fragment key={group.value}>
                            <ComboboxGroup items={group.items}>
                              <ComboboxGroupLabel>
                                {m.treasury_period_label({ name: group.value })}
                              </ComboboxGroupLabel>
                              <ComboboxCollection>
                                {(month: string) => (
                                  <ComboboxItem key={month} value={month}>
                                    {formatMonth(month)}
                                  </ComboboxItem>
                                )}
                              </ComboboxCollection>
                            </ComboboxGroup>
                            <ComboboxSeparator />
                          </Fragment>
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
                name="occurredOn"
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
                            disabled={isBusy}
                            className="w-full justify-between pr-2"
                          >
                            <span id={`${dateTriggerId}-value`} className="truncate font-normal">
                              {formatDay(field.value)}
                            </span>
                            <IconSelector className="pointer-events-none size-4" />
                          </Button>
                        }
                      />
                      <PopoverPopup className="w-auto p-1">
                        <PeriodCalendar
                          value={field.value}
                          onChange={(day) => {
                            field.onChange(day)
                            keepLateWaivedMonths(feeMonths, day)
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
                    <Input {...field} autoComplete="off" disabled={isBusy} />
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </div>

            <Controller
              name="paymentMethod"
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
                    disabled={isBusy}
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
                    <Input {...field} autoComplete="off" disabled={isBusy} />
                    <FieldDescription>{m.treasury_transfer_reference_description()}</FieldDescription>
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            )}

            {preview && preview.lateMonths.length > 0 && (
              <Controller
                name="waivedMonths"
                control={form.control}
                render={({ field }) => (
                  <WaiveLateFees
                    lateMonths={preview.lateMonths}
                    dueDay={preview.period.dueDay}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isBusy}
                  />
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
                  <Textarea {...field} rows={3} className="max-h-40" disabled={isBusy} />
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
                        amount: formatCurrency(preview.period.monthlyFee, preview.period.currency),
                      })}
                    </dt>
                    <dd className="text-right">{formatCurrency(preview.fees, preview.period.currency)}</dd>
                    {preview.lateMonths.length > 0 && (
                      <>
                        <dt className="text-muted-foreground">
                          {m.treasury_late_fees_of({
                            count: preview.lateMonths.length,
                            amount: formatCurrency(preview.period.lateFee, preview.period.currency),
                          })}
                          {preview.waivedCount > 0 && ` ${m.treasury_waived({ count: preview.waivedCount })}`}
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
              periods && <NoPeriodAlert />
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
          <DrawerClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </DrawerClose>
          <Button type="submit" form={FORM_ID} disabled={isBusy || !preview} loading={isBusy}>
            {m.treasury_record()}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconSelector } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { addYears, format, parseISO, subYears } from 'date-fns'
import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { PAYMENT_METHOD_ITEMS } from '@/components/treasury/kind'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { useFormatCurrency } from '@/hooks/use-currency'
import { useToday } from '@/hooks/use-today'
import { type CurrencyCode, currencySymbol, formatDay, intlLocale, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import { type CancelReservationInput, cancelReservationSchema } from '@/lib/validations/presidency'
import { m } from '@/paraglide/messages'
import { cancelReservation } from '@/server-actions/presidency'
import { PRESIDENCY_QUERY_KEY, type ReservationQueryData } from '@/tanstack-queries/presidency'
import { TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { reservationPayment, reservationSummary } from '../status'

const FORM_ID = 'cancel-reservation-form'

interface CancelReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  reservation: ReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CancelMutation = UseMutationResult<void, Error, CancelReservationInput>

/**
 * Treasurer: cancels a paid booking and frees its day. The income stays in the
 * ledger; whatever is given back is recorded as an amenity_refund expense.
 */
export function CancelReservationDrawer({
  reservation,
  open,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: CancelReservationDrawerProps) {
  const queryClient = useQueryClient()
  const formatCurrency = useFormatCurrency()
  const summary = reservationSummary(reservation)
  const paid = Number(reservationPayment(reservation)?.amount ?? 0)
  const { currency } = reservation

  const mutation = useMutation({
    mutationFn: async (values: CancelReservationInput) => {
      const result = await cancelReservation(reservation.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.presidency_reservation_cancelled(),
        description:
          values.refund_amount > 0
            ? m.presidency_reservation_cancelled_refund_description({
                summary,
                amount: formatCurrency(values.refund_amount, currency),
              })
            : m.presidency_reservation_cancelled_no_refund_description({ summary }),
      })
      onOpenChange(false)
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the form busy while the drawer slides out.
        if (!isOpen) {
          mutation.reset()
        }
        onOpenChangeComplete?.(isOpen)
      }}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.presidency_cancel_reservation()}</DrawerTitle>
          <DrawerDescription>
            {m.presidency_cancel_reservation_description({ summary, amount: formatCurrency(paid, currency) })}
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while open so the defaults (today, full refund) are fresh. */}
        <CancelReservationForm paid={paid} currency={currency} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

interface CancelReservationFormProps {
  paid: number
  currency: CurrencyCode
  mutation: CancelMutation
}

function CancelReservationForm({ paid, currency, mutation }: CancelReservationFormProps) {
  const [isDateOpen, setDateOpen] = useState(false)
  const dateTriggerId = useId()
  const today = useToday()
  const formatCurrency = useFormatCurrency()

  const form = useForm<CancelReservationInput>({
    resolver: zodResolver(
      cancelReservationSchema.refine((data) => data.refund_amount <= paid, {
        path: ['refund_amount'],
        error: () => m.presidency_refund_max({ amount: formatCurrency(paid, currency) }),
      }),
    ),
    defaultValues: {
      refund_amount: paid,
      occurred_on: format(today, ISO_DAY),
      payment_method: 'cash',
      reference: '',
      notes: '',
    },
  })
  const refundAmount = useWatch({ control: form.control, name: 'refund_amount' })
  const paymentMethod = useWatch({ control: form.control, name: 'payment_method' })
  const hasRefund = refundAmount > 0

  // Still busy after a cancellation, until the drawer has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <>
      <DrawerPanel>
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values, {
              onError: (error) => form.setError('root', { message: error.message }),
            }),
          )}
        >
          <Controller
            name="refund_amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.presidency_refund()} <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <NumberField
                    value={field.value ?? null}
                    onValueChange={(value) => {
                      field.onChange(value ?? 0)
                    }}
                    min={0}
                    max={paid}
                    locale={intlLocale()}
                    format={MONEY_FORMAT}
                    disabled={isBusy}
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
                <FieldDescription>{m.presidency_refund_description()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {hasRefund && (
            <>
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
                        {m.presidency_refund_date()} <span className="text-destructive">*</span>
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
                              <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                            </Button>
                          }
                        />
                        <PopoverPopup className="w-auto p-1">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown"
                            startMonth={subYears(today, 2)}
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
                        {m.presidency_method()} <span className="text-destructive">*</span>
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
              </div>

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
                        {m.presidency_transfer_reference()} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input {...field} autoComplete="off" disabled={isBusy} />
                      <FieldDescription>{m.presidency_transfer_reference_description()}</FieldDescription>
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
                    <Textarea {...field} rows={3} className="max-h-40" disabled={isBusy} />
                    <FieldDescription>{m.presidency_refund_notes_description()}</FieldDescription>
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </>
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
          {m.presidency_go_back()}
        </DrawerClose>
        <Button type="submit" form={FORM_ID} variant="destructive" disabled={isBusy} loading={isBusy}>
          {m.presidency_cancel_reservation()}
        </Button>
      </DrawerFooter>
    </>
  )
}

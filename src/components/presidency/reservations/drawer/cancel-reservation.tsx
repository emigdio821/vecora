import { zodResolver } from '@hookform/resolvers/zod'
import { ParaglideMessage } from '@inlang/paraglide-js-react'
import { IconAlertCircle, IconSelector } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { messageMarkup } from '@/components/shared/message-markup'
import { NoPeriodAlert, useIsPeriodMissing } from '@/components/shared/no-period-alert'
import { PeriodCalendar } from '@/components/shared/period-calendar'
import { PAYMENT_METHOD_ITEMS } from '@/components/treasury/kind'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import {
  type CurrencyCode,
  currencySymbol,
  formatDay,
  intlLocale,
  ISO_DAY,
  MONEY_FORMAT,
  MONEY_STEP,
} from '@/lib/utils'
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
  const paid = reservationPayment(reservation)?.amount ?? 0
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
          values.refundAmount > 0
            ? m.presidency_reservation_cancelled_refund_description({
                summary,
                amount: formatCurrency(values.refundAmount, currency),
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
      <DrawerPopup>
        <DrawerHeader>
          <DrawerTitle>{m.presidency_cancel_reservation()}</DrawerTitle>
          <DrawerDescription>
            <ParaglideMessage
              markup={messageMarkup}
              message={m.presidency_cancel_reservation_description}
              inputs={{ summary, amount: formatCurrency(paid, currency) }}
            />
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
      cancelReservationSchema.refine((data) => data.refundAmount <= paid, {
        path: ['refundAmount'],
        error: () => m.presidency_refund_max({ amount: formatCurrency(paid, currency) }),
      }),
    ),
    defaultValues: {
      refundAmount: paid,
      occurredOn: format(today, ISO_DAY),
      paymentMethod: 'cash',
      reference: '',
      notes: '',
    },
  })
  const refundAmount = useWatch({ control: form.control, name: 'refundAmount' })
  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' })
  const occurredOn = useWatch({ control: form.control, name: 'occurredOn' })
  const hasRefund = refundAmount > 0
  // Only the refund is a movement; cancelling without one needs no period.
  const isPeriodMissing = useIsPeriodMissing(occurredOn) && hasRefund

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
            name="refundAmount"
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
                    step={MONEY_STEP}
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
                              <IconSelector className="pointer-events-none size-4" />
                            </Button>
                          }
                        />
                        <PopoverPopup className="w-auto p-1">
                          <PeriodCalendar
                            value={field.value}
                            onChange={(day) => {
                              field.onChange(day)
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
                    <FieldDescription>
                      <ParaglideMessage
                        markup={messageMarkup}
                        message={m.presidency_refund_notes_description}
                      />
                    </FieldDescription>
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </>
          )}

          {isPeriodMissing && <NoPeriodAlert />}

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
        <Button
          type="submit"
          form={FORM_ID}
          variant="destructive"
          disabled={isBusy || isPeriodMissing}
          loading={isBusy}
        >
          {m.presidency_cancel_reservation()}
        </Button>
      </DrawerFooter>
    </>
  )
}

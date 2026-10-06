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
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { useFormatCurrency } from '@/hooks/use-currency'
import { useToday } from '@/hooks/use-today'
import { formatDay, ISO_DAY } from '@/lib/utils'
import { type PayReservationInput, payReservationSchema } from '@/lib/validations/presidency'
import { m } from '@/paraglide/messages'
import { payReservation } from '@/server-actions/presidency'
import { PRESIDENCY_QUERY_KEY, type ReservationQueryData } from '@/tanstack-queries/presidency'
import { TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { reservationSummary } from '../status'

const FORM_ID = 'pay-reservation-form'

interface PayReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  reservation: ReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PayMutation = UseMutationResult<{ transaction_id: string }, Error, PayReservationInput>

/** Treasurer: records the fee as income in the ledger, which marks the booking paid. */
export function PayReservationDrawer({
  reservation,
  open,
  onOpenChange,
  ...props
}: PayReservationDrawerProps) {
  const queryClient = useQueryClient()
  const formatCurrency = useFormatCurrency()
  const summary = reservationSummary(reservation)
  const amount = formatCurrency(reservation.amount, reservation.currency)

  const mutation = useMutation({
    mutationFn: async (values: PayReservationInput) => {
      const result = await payReservation(reservation.id, values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      // The income now exists in the ledger.
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.presidency_payment_recorded(),
        description: m.presidency_payment_recorded_description({ summary, amount }),
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
    <Drawer position="right" open={open} onOpenChange={handleOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.common_action_record_payment()}</DrawerTitle>
          <DrawerDescription>
            {m.presidency_pay_reservation_description({ summary, amount })}
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while open so the default date is fresh. */}
        <PayReservationForm mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function PayReservationForm({ mutation }: { mutation: PayMutation }) {
  const [isDateOpen, setDateOpen] = useState(false)
  const dateTriggerId = useId()
  const today = useToday()

  const form = useForm<PayReservationInput>({
    resolver: zodResolver(payReservationSchema),
    defaultValues: {
      occurred_on: format(today, ISO_DAY),
      folio: '',
      payment_method: 'cash',
      reference: '',
      notes: '',
    },
  })
  const paymentMethod = useWatch({ control: form.control, name: 'payment_method' })

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
                    {m.presidency_payment_date()} <span className="text-destructive">*</span>
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
                    {m.common_field_folio()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                  <FieldDescription>{m.presidency_folio_description()}</FieldDescription>
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
                    {m.presidency_transfer_reference()} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} autoComplete="off" disabled={mutation.isPending} />
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
                <Textarea {...field} rows={3} className="max-h-40" disabled={mutation.isPending} />
                <FieldDescription>{m.presidency_payment_notes_description()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

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
        <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
          {m.common_action_record_payment()}
        </Button>
      </DrawerFooter>
    </>
  )
}

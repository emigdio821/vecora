'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { addYears, format, parseISO, subYears } from 'date-fns'
import { ChevronsUpDownIcon, CircleAlertIcon } from 'lucide-react'
import { useState } from 'react'
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
import { useToday } from '@/hooks/use-today'
import { formatCurrency, formatDay, ISO_DAY } from '@/lib/utils'
import { type PayHallReservationInput, payHallReservationSchema } from '@/lib/validations/presidency'
import { payHallReservation } from '@/server-actions/presidency'
import { type HallReservationQueryData, PRESIDENCY_QUERY_KEY } from '@/tanstack-queries/presidency'
import { TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'

const FORM_ID = 'pay-hall-reservation-form'

interface PayHallReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  reservation: HallReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PayMutation = UseMutationResult<{ transaction_id: string }, Error, PayHallReservationInput>

/** Treasurer: records the fee as income in the ledger, which marks the booking paid. */
export function PayHallReservationDrawer({
  reservation,
  open,
  onOpenChange,
  ...props
}: PayHallReservationDrawerProps) {
  const queryClient = useQueryClient()
  const summary = `${formatDay(reservation.reserved_on)} - Casa ${reservation.property.number}`

  const mutation = useMutation({
    mutationFn: async (values: PayHallReservationInput) => {
      const result = await payHallReservation(reservation.id, values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      // The income now exists in the ledger.
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Pago registrado',
        description: `${summary} - ${formatCurrency(reservation.amount)} ya está en "Tesorería"`,
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
          <DrawerTitle>Registrar pago</DrawerTitle>
          <DrawerDescription>
            Terraza {summary} - {formatCurrency(reservation.amount)}. Se registrará como ingreso en
            "Tesorería" y la reservación pasará a "Pagada".
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while open so the default date is fresh. */}
        <PayHallReservationForm mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function PayHallReservationForm({ mutation }: { mutation: PayMutation }) {
  const [isDateOpen, setDateOpen] = useState(false)
  const today = useToday()

  const form = useForm<PayHallReservationInput>({
    resolver: zodResolver(payHallReservationSchema),
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
                  <FieldLabel>
                    Fecha del pago <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Popover open={isDateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger
                      ref={field.ref}
                      render={
                        <Button
                          variant="outline"
                          aria-invalid={fieldState.invalid}
                          disabled={mutation.isPending}
                          className="w-full justify-between pr-2"
                        >
                          <span className="truncate font-normal">{formatDay(field.value)}</span>
                          <ChevronsUpDownIcon className="pointer-events-none size-4 text-muted-foreground" />
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
                    Folio <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                  <FieldDescription>El número del recibo entregado.</FieldDescription>
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
                  Método de pago <span className="text-destructive">*</span>
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
                    Referencia de la transferencia <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input {...field} autoComplete="off" disabled={mutation.isPending} />
                  <FieldDescription>Clave de rastreo o número de referencia del banco.</FieldDescription>
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
                <FieldLabel>Notas</FieldLabel>
                <Textarea {...field} rows={3} className="max-h-40" disabled={mutation.isPending} />
                <FieldDescription>Opcional. Se guardan en el movimiento de "Tesorería".</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <Alert variant="error">
              <CircleAlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
          Cancelar
        </DrawerClose>
        <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
          Registrar pago
        </Button>
      </DrawerFooter>
    </>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconSelector } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { addYears, format, parseISO, subYears } from 'date-fns'
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
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { useToday } from '@/hooks/use-today'
import { formatCurrency, formatDay, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import { type CancelHallReservationInput, cancelHallReservationSchema } from '@/lib/validations/presidency'
import { cancelHallReservation } from '@/server-actions/presidency'
import { type HallReservationQueryData, PRESIDENCY_QUERY_KEY } from '@/tanstack-queries/presidency'
import { TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'
import { hallPayment } from '../status'

const FORM_ID = 'cancel-hall-reservation-form'

interface CancelHallReservationDrawerProps extends React.ComponentProps<typeof Drawer> {
  reservation: HallReservationQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CancelMutation = UseMutationResult<void, Error, CancelHallReservationInput>

/**
 * Treasurer: cancels a paid booking and frees its day. The income stays in the
 * ledger; whatever is given back is recorded as a "Reembolso de terraza" expense.
 */
export function CancelHallReservationDrawer({
  reservation,
  open,
  onOpenChange,
  ...props
}: CancelHallReservationDrawerProps) {
  const queryClient = useQueryClient()
  const summary = `${formatDay(reservation.reserved_on)} - Casa ${reservation.property.number}`
  const paid = Number(hallPayment(reservation)?.amount ?? 0)

  const mutation = useMutation({
    mutationFn: async (values: CancelHallReservationInput) => {
      const result = await cancelHallReservation(reservation.id, values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [PRESIDENCY_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Reservación cancelada',
        description:
          values.refund_amount > 0
            ? `${summary}. Reembolso de ${formatCurrency(values.refund_amount)} registrado en "Tesorería"`
            : `${summary}. Sin reembolso`,
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
          <DrawerTitle>Cancelar reservación</DrawerTitle>
          <DrawerDescription>
            {summary}, pagada con {formatCurrency(paid)}. El día quedará libre para otra casa. El ingreso se
            queda en "Tesorería" y lo que se devuelva se registra como egreso.
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while open so the defaults (today, full refund) are fresh. */}
        <CancelHallReservationForm paid={paid} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function CancelHallReservationForm({ paid, mutation }: { paid: number; mutation: CancelMutation }) {
  const [isDateOpen, setDateOpen] = useState(false)
  const today = useToday()

  const form = useForm<CancelHallReservationInput>({
    resolver: zodResolver(
      cancelHallReservationSchema.refine((data) => data.refund_amount <= paid, {
        path: ['refund_amount'],
        message: `El reembolso no puede ser mayor a ${formatCurrency(paid)}`,
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
                  Reembolso <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <NumberField
                    value={field.value ?? null}
                    onValueChange={(value) => {
                      field.onChange(value ?? 0)
                    }}
                    min={0}
                    max={paid}
                    locale="es-MX"
                    format={MONEY_FORMAT}
                    disabled={mutation.isPending}
                  >
                    <NumberFieldInput ref={field.ref} className="text-left" inputMode="decimal" />
                  </NumberField>
                  <InputGroupAddon>
                    <InputGroupText>$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>MXN</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>Lo que se le devuelve a la casa. 0 si no hay reembolso.</FieldDescription>
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
                      <FieldLabel>
                        Fecha del reembolso <span className="text-destructive">*</span>
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
                        Método <span className="text-destructive">*</span>
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
                    <FieldDescription>Opcional. Se guardan en el egreso de "Tesorería".</FieldDescription>
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </>
          )}

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
          Volver
        </DrawerClose>
        <Button
          type="submit"
          form={FORM_ID}
          variant="destructive"
          disabled={mutation.isPending}
          loading={mutation.isPending}
        >
          Cancelar reservación
        </Button>
      </DrawerFooter>
    </>
  )
}

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
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
import { ChevronsUpDownIcon, CircleAlertIcon } from 'lucide-react'
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
import { formatCurrency, formatDay, formatMonth, ISO_DAY } from '@/lib/utils'
import { type RecordFeePaymentInput, recordFeePaymentSchema } from '@/lib/validations/treasury'
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
  const { data: periods } = useQuery(periodsQueryOptions())

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

      const months = summary.fee_count === 1 ? '1 mes' : `${summary.fee_count} meses`
      const recargo = summary.late_fee_count > 0 ? ' con recargo' : ''
      toastManager.add({
        type: 'success',
        title: 'Cuota registrada',
        description: `${house ? houseLabel(house) : 'Casa'}: ${months}${recargo}, ${formatCurrency(summary.total)} · Folio ${values.folio}`,
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
          <DrawerTitle>Registrar cuota</DrawerTitle>
          <DrawerDescription>
            Un recibo por casa. Si paga varios meses, selecciónalos todos; el recargo se calcula por cada mes
            pagado después del día límite.
          </DrawerDescription>
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
                    Casa <span className="text-destructive">*</span>
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
                    Meses que paga <span className="text-destructive">*</span>
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
                                removeProps={{ 'aria-label': 'Quitar' }}
                              >
                                {formatMonth(month)}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput placeholder={value.length > 0 ? undefined : 'Buscar mes'} />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxPopup>
                      <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
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
                    <FieldLabel>
                      Fecha de pago <span className="text-destructive">*</span>
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
                          startMonth={subYears(new Date(), 5)}
                          endMonth={addYears(new Date(), 1)}
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
                      Folio del recibo <span className="text-destructive">*</span>
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
                      <Label htmlFor={waiveSwitchId}>Condonar recargo</Label>
                      <p className="text-xs text-muted-foreground">
                        {preview.lateMonths === 1 ? '1 mes se paga' : `${preview.lateMonths} meses se pagan`}{' '}
                        después del día {preview.period.due_day}. Actívalo si la mesa directiva perdonó el
                        recargo.
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
                  <FieldLabel>Notas</FieldLabel>
                  <Textarea {...field} rows={3} className="max-h-40" disabled={mutation.isPending} />
                  <FieldDescription>
                    Opcional. Quién pagó, acuerdos, o cualquier observación.
                  </FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {preview ? (
              <Alert>
                <AlertTitle>Periodo {preview.period.name}</AlertTitle>
                <AlertDescription>
                  <dl className="grid grid-cols-[1fr_auto] gap-x-4 text-sm tabular-nums">
                    <dt className="text-muted-foreground">
                      {feeMonths.length === 1 ? '1 cuota' : `${feeMonths.length} cuotas`} de{' '}
                      {formatCurrency(preview.period.monthly_fee)}
                    </dt>
                    <dd className="text-right">{formatCurrency(preview.fees)}</dd>
                    {preview.lateMonths > 0 && (
                      <>
                        <dt className="text-muted-foreground">
                          {preview.lateMonths === 1 ? '1 recargo' : `${preview.lateMonths} recargos`} de{' '}
                          {formatCurrency(preview.period.late_fee)}
                          {waiveLateFee && ' (condonado)'}
                        </dt>
                        <dd className="text-right">{formatCurrency(preview.lateFees)}</dd>
                      </>
                    )}
                    <dt className="font-medium">Total a recibir</dt>
                    <dd className="text-right font-medium text-foreground">
                      {formatCurrency(preview.total)}
                    </dd>
                  </dl>
                </AlertDescription>
              </Alert>
            ) : (
              periods && (
                <Alert variant="warning">
                  <CircleAlertIcon />
                  <AlertTitle>Sin periodo</AlertTitle>
                  <AlertDescription>
                    Ningún periodo cubre la fecha de pago. Crea el periodo antes de registrar cuotas.
                  </AlertDescription>
                </Alert>
              )
            )}

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
          <Button
            type="submit"
            form={FORM_ID}
            disabled={mutation.isPending || !preview}
            loading={mutation.isPending}
          >
            Registrar
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

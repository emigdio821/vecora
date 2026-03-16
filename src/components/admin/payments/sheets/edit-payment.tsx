import { zodResolver } from '@hookform/resolvers/zod'
import { IconSelector } from '@tabler/icons-react'
import { Activity, useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updatePayment } from '@/api/server-functions/payments'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PAYMENTS_QUERY_KEY, type PaymentQueryData } from '@/api/tanstack-queries/payments'
import { LoaderIcon } from '@/components/icons'
import { ResidentsSelector } from '@/components/shared/selectors/residents-selector'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { type PaymentType, paymentStatusSchema, paymentTypeSchema } from '@/db/schema/zod/payments'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { formatDate, getAllMonthsMap, getPaymentStatusLabel, getPaymentTypeLabel } from '@/lib/utils'
import { type UpdatePaymentFormData, updatePaymentSchema } from '@/schemas/payments'

interface UpdatePaymentSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
  payment: PaymentQueryData
}

const MONTHS = getAllMonthsMap()
const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear + 2 - 2020 + 1 }, (_, i) => 2020 + i)

export function EditPaymentSheet({ state, payment }: UpdatePaymentSheetProps) {
  const updatePaymentFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<UpdatePaymentFormData>({
    resolver: zodResolver(updatePaymentSchema),
    values: {
      paymentId: payment.id,
      residentId: payment.residentId,
      concept: payment.concept,
      amount: payment.amount,
      paymentType: payment.paymentType,
      year: payment.year,
      months: payment.paymentMonths.map((pm) => pm.month),
      status: payment.status,
      paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
    },
  })

  const watchPaymentType = form.watch('paymentType', payment.paymentType || 'monthly_fee')
  const watchPaymentStatus = form.watch('status', payment.status || 'pending')

  const updatePaymentMutation = useEntityMutation({
    mutationFn: async (data: UpdatePaymentFormData) => {
      return await updatePayment({ data })
    },
    invalidateKeys: [PAYMENTS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Pago actualizado',
    successDescription: 'El pago ha sido actualizado exitosamente.',
    errorDescription: 'Ocurrió un error al actualizar el pago, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdatePaymentFormData) {
    updatePaymentMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updatePaymentMutation.isPending) return
    onOpenChange(open)
  }

  function renderPaymentTypeValue(value: PaymentType | undefined) {
    if (!value) return 'Selecciona una opción'

    return getPaymentTypeLabel(value)
  }

  function renderPaymentMonthsValue(value: number[] | undefined) {
    if (!value || value.length === 0) return 'Selecciona una opción'

    const selectedMonths = Object.entries(MONTHS)
      .filter(([key]) => value.includes(Number(key)))
      .map(([, month]) => month)
    return selectedMonths.join(', ')
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Editar pago</SheetTitle>
          <SheetDescription>Actualiza la información del pago.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={updatePaymentFormId}
            aria-label="Editar pago"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Monto <span className="text-destructive">*</span>
                  </FieldLabel>

                  <InputGroup>
                    <InputGroupInput
                      type="number"
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <InputGroupAddon>
                      <InputGroupText>$</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>MXN</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="residentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Propietario <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ResidentsSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={updatePaymentMutation.isPending}
                    invalid={fieldState.invalid}
                    includeNoneOption={false}
                  />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="paymentType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tipo de pago <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue>{renderPaymentTypeValue}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {paymentTypeSchema.options.map((type) => (
                          <SelectItem key={type} value={type}>
                            {renderPaymentTypeValue(type)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="concept"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Concepto <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.value}
                    className="max-h-40"
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                    disabled={updatePaymentMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="months"
              control={form.control}
              render={({ field, fieldState }) => (
                <Activity
                  name="months-activity"
                  mode={watchPaymentType === 'monthly_fee' ? 'visible' : 'hidden'}
                >
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Meses <span className="text-destructive">*</span>
                    </FieldLabel>

                    <Select multiple value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue>{renderPaymentMonthsValue}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-96">
                        <SelectGroup>
                          {Object.entries(MONTHS).map(([value, month]) => (
                            <SelectItem key={value} value={Number(value)}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                </Activity>
              )}
            />

            <Controller
              name="year"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Año</FieldLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96">
                      <SelectGroup>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error?.message && <FieldError>{fieldState.error?.message}</FieldError>}
                </Field>
              )}
            />

            <Controller
              name="paymentId"
              control={form.control}
              render={({ field }) => <input type="hidden" className="hidden" {...field} />}
            />

            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Estatus</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) {
                        if (value === 'pending') {
                          form.setValue('paidAt', null)
                        } else if (value === 'paid' && !form.getValues('paidAt')) {
                          form.setValue('paidAt', new Date())
                        }
                        field.onChange(value)
                      }
                    }}
                  >
                    <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue placeholder="Selecciona una opción">
                        {getPaymentStatusLabel(field.value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {paymentStatusSchema.options.map((status) => (
                          <SelectItem key={status} value={status}>
                            {getPaymentStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error?.message && <FieldError>{fieldState.error?.message}</FieldError>}
                </Field>
              )}
            />

            <Controller
              name="paidAt"
              control={form.control}
              render={({ field, fieldState }) => (
                <Popover>
                  <Activity
                    name="paid-at-activity"
                    mode={watchPaymentStatus === 'paid' ? 'visible' : 'hidden'}
                  >
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Fecha de pago</FieldLabel>
                      <PopoverTrigger
                        render={
                          <Button
                            id={field.name}
                            variant="outline"
                            aria-invalid={fieldState.invalid}
                            className="w-full justify-between pr-2"
                            disabled={updatePaymentMutation.isPending}
                          >
                            <span className="font-normal">{formatDate(field.value || new Date())}</span>
                            <IconSelector className="pointer-events-none size-4 text-muted-foreground" />
                          </Button>
                        }
                      />
                      <PopoverContent className="p-1">
                        <Calendar
                          mode="single"
                          id={field.name}
                          selected={field.value || new Date()}
                          disabled={
                            updatePaymentMutation.isPending || {
                              after: new Date(),
                            }
                          }
                          onSelect={(date) => field.onChange(date || new Date())}
                        />
                      </PopoverContent>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  </Activity>
                </Popover>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <SheetClose
            render={
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            }
          />
          <Button type="submit" form={updatePaymentFormId} disabled={updatePaymentMutation.isPending}>
            {updatePaymentMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

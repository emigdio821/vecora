'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, type UseMutationResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { addYears, format, parseISO, subYears } from 'date-fns'
import { ChevronsUpDownIcon, CircleAlertIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { formatCurrency, formatDay, ISO_DAY } from '@/lib/utils'
import { type PayRequestInput, payRequestSchema } from '@/lib/validations/requests'
import { paySecurityRequest } from '@/server-actions/security'
import { SECURITY_QUERY_KEY, type SecurityRequestQueryData } from '@/tanstack-queries/security'
import { categoriesQueryOptions, TREASURY_QUERY_KEY } from '@/tanstack-queries/treasury'

const FORM_ID = 'pay-request-form'

/** Preselected expense category; the treasurer can still pick another. */
const DEFAULT_CATEGORY_NAME = 'Vigilancia'

interface PayRequestDrawerProps extends React.ComponentProps<typeof Drawer> {
  request: SecurityRequestQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PayMutation = UseMutationResult<{ transaction_id: string }, Error, PayRequestInput>

/** Treasurer: records the expense in the ledger and marks the request paid. */
export function PayRequestDrawer({ request, open, onOpenChange, ...props }: PayRequestDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: PayRequestInput) => {
      const result = await paySecurityRequest(request.id, values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SECURITY_QUERY_KEY] })
      // The expense now exists in the ledger.
      void queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Pago registrado',
        description: `${request.title} - ${formatCurrency(Number(request.amount))} ya está en "Tesorería"`,
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
            {request.title} - {formatCurrency(Number(request.amount))}. Se registrará como egreso en
            "Tesorería" y la solicitud pasará a "Pagada".
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while open so the defaults (today, category) are fresh. */}
        <PayRequestForm mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function PayRequestForm({ mutation }: { mutation: PayMutation }) {
  const [isDateOpen, setDateOpen] = useState(false)
  const { data: categories } = useQuery(categoriesQueryOptions())

  // Expense categories the treasurer can book this under (fee categories are income anyway).
  const categoryItems = useMemo(
    () =>
      (categories ?? [])
        .filter((c) => c.kind === 'expense' && c.is_active)
        .map((c) => ({ value: c.id, label: c.name })),
    [categories],
  )

  const form = useForm<PayRequestInput>({
    resolver: zodResolver(payRequestSchema),
    defaultValues: {
      category_id: '',
      occurred_on: format(new Date(), ISO_DAY),
      payment_method: 'cash',
      reference: '',
      notes: '',
    },
  })
  const paymentMethod = useWatch({ control: form.control, name: 'payment_method' })

  // Preselect "Vigilancia" once categories arrive, unless the treasurer already chose.
  const defaultCategoryId = categoryItems.find((c) => c.label === DEFAULT_CATEGORY_NAME)?.value
  useEffect(() => {
    if (defaultCategoryId && !form.getValues('category_id')) {
      form.setValue('category_id', defaultCategoryId)
    }
  }, [defaultCategoryId, form])

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
            name="category_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  Categoría del egreso <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  items={categoryItems}
                  value={field.value || null}
                  onValueChange={(value) => {
                    field.onChange(value ?? '')
                  }}
                  disabled={mutation.isPending || !categories}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={categories ? 'Selecciona una categoría' : 'Cargando…'} />
                  </SelectTrigger>
                  <SelectPopup>
                    {categoryItems.map((item) => (
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
                      startMonth={subYears(new Date(), 2)}
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

'use client'

import { useQuery } from '@tanstack/react-query'
import { addYears, format, parseISO, subYears } from 'date-fns'
import { ChevronsUpDownIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { HousesPicker } from '@/components/shared/pickers/houses-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroupPrimitive, RadioPrimitive } from '@/components/ui/radio-group'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToday } from '@/hooks/use-today'
import { segmentedControlItemVariants, segmentedControlRootClassName } from '@/lib/segmented-control'
import { formatDay, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import type { CreateTransactionInput } from '@/lib/validations/treasury'
import { categoriesQueryOptions } from '@/tanstack-queries/treasury'
import { KIND_ITEMS, PAYMENT_METHOD_ITEMS } from '../../kind'

const kindItemClassName = segmentedControlItemVariants({ className: 'grow', state: 'checked' })

interface TransactionFormFieldsProps {
  form: UseFormReturn<CreateTransactionInput>
  disabled?: boolean
  /** Editing: the kind is fixed once recorded. */
  lockKind?: boolean
  /**
   * Editing a fee / late-fee row: those come from record_fee_payment, so only
   * the receipt details (folio, method, reference, notes) may change.
   */
  lockFeeFields?: boolean
}

/** Shared by the create and edit drawers for non-fee movements. */
export function TransactionFormFields({
  form,
  disabled,
  lockKind,
  lockFeeFields,
}: TransactionFormFieldsProps) {
  const [isDateOpen, setDateOpen] = useState(false)
  const today = useToday()
  const { data: categories } = useQuery(categoriesQueryOptions())
  const [kind, paymentMethod, categoryId] = useWatch({
    control: form.control,
    name: ['kind', 'payment_method', 'category_id'],
  })

  // Fees have their own drawer, so the two system categories (key != null) are
  // left out — unless we're editing one, which must stay selectable to display.
  const categoryItems = useMemo(
    () =>
      (categories ?? [])
        .filter((c) => c.kind === kind && ((c.is_active && !c.key) || c.id === categoryId))
        .map((c) => ({ value: c.id, label: c.name })),
    [categories, kind, categoryId],
  )

  const lockedForFee = disabled || lockFeeFields

  return (
    <>
      <Controller
        name="kind"
        control={form.control}
        render={({ field }) => (
          <Field name={field.name}>
            <FieldLabel>Tipo</FieldLabel>
            <RadioGroupPrimitive
              className={segmentedControlRootClassName}
              aria-label="Tipo de movimiento"
              name={field.name}
              value={field.value}
              disabled={disabled || lockKind}
              onValueChange={(value) => {
                field.onChange(value)
                // Categories belong to one kind, so the pick no longer applies.
                form.setValue('category_id', '')
              }}
            >
              {KIND_ITEMS.map((item) => (
                <RadioPrimitive.Root key={item.value} className={kindItemClassName} value={item.value}>
                  {item.label}
                </RadioPrimitive.Root>
              ))}
            </RadioGroupPrimitive>
          </Field>
        )}
      />

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
              Categoría <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              items={categoryItems}
              value={field.value || null}
              onValueChange={(value) => {
                field.onChange(value ?? '')
              }}
              disabled={lockedForFee || !categories}
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
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              Concepto <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} autoComplete="off" disabled={lockedForFee} />
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="amount"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
            >
              <FieldLabel>
                Monto <span className="text-destructive">*</span>
              </FieldLabel>
              <InputGroup>
                <NumberField
                  value={field.value ?? null}
                  onValueChange={(value) => {
                    field.onChange(value)
                  }}
                  min={0}
                  locale="es-MX"
                  format={MONEY_FORMAT}
                  disabled={lockedForFee}
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
                Fecha <span className="text-destructive">*</span>
              </FieldLabel>
              <Popover open={isDateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger
                  ref={field.ref}
                  render={
                    <Button
                      variant="outline"
                      aria-invalid={fieldState.invalid}
                      disabled={lockedForFee}
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
              disabled={disabled}
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
              <Input {...field} autoComplete="off" disabled={disabled} />
              <FieldDescription>Clave de rastreo o número de referencia del banco.</FieldDescription>
              <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
      )}

      {kind === 'income' && (
        <>
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
                <Input {...field} autoComplete="off" disabled={disabled} />
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

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
                <FieldLabel>Casa</FieldLabel>
                <HousesPicker
                  value={field.value}
                  onValueChange={field.onChange}
                  inputRef={field.ref}
                  disabled={lockedForFee}
                />
                <FieldDescription>Opcional. Si el dinero viene de una casa en particular.</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
        </>
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
            <Textarea {...field} rows={3} className="max-h-40" disabled={disabled} />
            <FieldDescription>Opcional. Proveedor, acuerdos, o cualquier observación.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

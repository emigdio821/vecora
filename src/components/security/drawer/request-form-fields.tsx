import { addYears, format, parseISO, subYears } from 'date-fns'
import { ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToday } from '@/hooks/use-today'
import { formatDay, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import type { SecurityRequestInput } from '@/lib/validations/security'
import { KIND_DESCRIPTION, KIND_ITEMS } from '../kind'

interface RequestFormFieldsProps {
  form: UseFormReturn<SecurityRequestInput>
  disabled?: boolean
}

/** Shared by the create and edit drawers. */
export function RequestFormFields({ form, disabled }: RequestFormFieldsProps) {
  const [isDateOpen, setDateOpen] = useState(false)
  const today = useToday()
  const kind = useWatch({ control: form.control, name: 'kind' })

  return (
    <>
      <Controller
        name="kind"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              Tipo <span className="text-destructive">*</span>
            </FieldLabel>
            <Select
              items={KIND_ITEMS}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value)
              }}
              disabled={disabled}
            >
              <SelectTrigger ref={field.ref} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {KIND_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
            <FieldDescription>{KIND_DESCRIPTION[kind]}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        name="title"
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
            <Input {...field} autoComplete="off" disabled={disabled} />
            <FieldDescription>Qué se hizo o qué se compró. Es lo que verá la tesorería.</FieldDescription>
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
                  disabled={disabled}
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
          name="requested_on"
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
                      disabled={disabled}
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
              <FieldDescription>Día del servicio, trabajo o compra.</FieldDescription>
              <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
      </div>

      <Controller
        name="details"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>Detalles</FieldLabel>
            <Textarea {...field} rows={3} className="max-h-40" disabled={disabled} />
            <FieldDescription>
              Opcional. Proveedor, turnos cubiertos, dónde se instaló, número de cámara.
            </FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

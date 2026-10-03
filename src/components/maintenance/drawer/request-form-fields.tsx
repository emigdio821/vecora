import { IconSelector } from '@tabler/icons-react'
import { addYears, format, parseISO, subYears } from 'date-fns'
import { useState } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useToday } from '@/hooks/use-today'
import { formatDay, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import type { MaintenanceRequestInput } from '@/lib/validations/maintenance'

interface RequestFormFieldsProps {
  form: UseFormReturn<MaintenanceRequestInput>
  disabled?: boolean
}

/** Shared by the create and edit drawers. */
export function RequestFormFields({ form, disabled }: RequestFormFieldsProps) {
  const [isDateOpen, setDateOpen] = useState(false)
  const today = useToday()

  return (
    <>
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
                Fecha del trabajo <span className="text-destructive">*</span>
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
              Opcional. Materiales, dónde se hizo, quién lo hizo, proveedor.
            </FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

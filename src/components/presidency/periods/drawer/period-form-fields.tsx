'use client'

import { addDays, addYears, format, parseISO, subYears } from 'date-fns'
import { ChevronsUpDownIcon, InfoIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldGroup, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { formatDay, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import type { PeriodInput } from '@/lib/validations/treasury'

interface PeriodFormFieldsProps {
  form: UseFormReturn<PeriodInput>
  disabled?: boolean
  /** Editing a period that already has movements: rates only apply going forward. */
  inUse?: boolean
}

/** Shared by the create and edit drawers. */
export function PeriodFormFields({ form, disabled, inUse }: PeriodFormFieldsProps) {
  const [openDate, setOpenDate] = useState<'starts_on' | 'ends_on' | null>(null)
  const startsOn = useWatch({ control: form.control, name: 'starts_on' })

  return (
    <>
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              Nombre <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} autoComplete="off" disabled={disabled} />
            <FieldDescription>Por ejemplo "2026-2027".</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {(['starts_on', 'ends_on'] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {name === 'starts_on' ? 'Inicio' : 'Fin'} <span className="text-destructive">*</span>
                </FieldLabel>
                <Popover
                  open={openDate === name}
                  onOpenChange={(open) => {
                    setOpenDate(open ? name : null)
                  }}
                >
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
                      startMonth={subYears(new Date(), 5)}
                      endMonth={addYears(new Date(), 5)}
                      selected={parseISO(field.value)}
                      defaultMonth={parseISO(field.value)}
                      // The end must come after the start (same rule as the schema).
                      disabled={name === 'ends_on' ? { before: addDays(parseISO(startsOn), 1) } : undefined}
                      onSelect={(date) => {
                        field.onChange(format(date ?? new Date(), ISO_DAY))
                        setOpenDate(null)
                      }}
                    />
                  </PopoverPopup>
                </Popover>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="monthly_fee"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
            >
              <FieldLabel>
                Cuota mensual <span className="text-destructive">*</span>
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
          name="late_fee"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched}
              dirty={fieldState.isDirty}
            >
              <FieldLabel>
                Recargo <span className="text-destructive">*</span>
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
      </div>

      <Controller
        name="due_day"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              Día límite de pago <span className="text-destructive">*</span>
            </FieldLabel>
            <NumberField
              value={field.value ?? null}
              onValueChange={(value) => {
                field.onChange(value)
              }}
              min={1}
              max={28}
              step={1}
              disabled={disabled}
            >
              <NumberFieldGroup>
                <NumberFieldInput ref={field.ref} className="text-left" inputMode="numeric" />
              </NumberFieldGroup>
            </NumberField>
            <FieldDescription>
              Las cuotas pagadas después de este día del mes llevan recargo. Entre 1 y 28.
            </FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {inUse && (
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Este periodo ya tiene movimientos</AlertTitle>
          <AlertDescription>
            Los cambios en la cuota, el recargo o el día límite solo aplican a las cuotas que se registren a
            partir de ahora.
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

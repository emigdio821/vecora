'use client'

import { useQuery } from '@tanstack/react-query'
import { addYears, format, parseISO, startOfToday } from 'date-fns'
import { ChevronsUpDownIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { HousesPicker } from '@/components/shared/pickers/houses-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useToday } from '@/hooks/use-today'
import { formatDay, formatMonth, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import type { HallReservationInput } from '@/lib/validations/presidency'
import { hallReservationsQueryOptions } from '@/tanstack-queries/presidency'
import { houseFeeStatusQueryOptions } from '@/tanstack-queries/treasury'

interface HallReservationFormFieldsProps {
  form: UseFormReturn<HallReservationInput>
  disabled?: boolean
  /** Editing: this booking's own day must stay selectable. */
  currentId?: string
  /** Editing a paid booking: the ledger already has its house and amount. */
  lockPaidFields?: boolean
}

/** Shared by the create and edit drawers. */
export function HallReservationFormFields({
  form,
  disabled,
  currentId,
  lockPaidFields,
}: HallReservationFormFieldsProps) {
  const [isDateOpen, setDateOpen] = useState(false)
  const today = useToday()
  const { data: reservations } = useQuery(hallReservationsQueryOptions())
  const { data: feeStatus } = useQuery(houseFeeStatusQueryOptions())
  const propertyId = useWatch({ control: form.control, name: 'property_id' })

  // Days already booked by someone else are greyed out; the DB enforces it
  // too (unique reserved_on), this just saves a failed submit. Cancelled
  // bookings no longer hold their day.
  const takenDays = useMemo(
    () =>
      (reservations ?? [])
        .filter((r) => r.id !== currentId && !r.cancelled_at)
        .map((r) => parseISO(r.reserved_on)),
    [reservations, currentId],
  )

  // A warning only: the board doesn't block a booking over missing fees. Once
  // paid the house is settled, so there's nothing left to warn about.
  const unpaidMonths = lockPaidFields
    ? []
    : (feeStatus?.find((h) => h.property_id === propertyId)?.unpaid_months ?? [])

  return (
    <>
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
              disabled={disabled || lockPaidFields}
            />
            <FieldDescription>La casa que aparta la terraza.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {unpaidMonths.length > 0 && (
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>Casa con cuotas pendientes</AlertTitle>
          <AlertDescription>
            Debe {unpaidMonths.length === 1 ? '1 mes' : `${unpaidMonths.length} meses`}:{' '}
            {unpaidMonths.map((month) => formatMonth(month)).join(', ')}. Puedes reservar de todos modos.
          </AlertDescription>
        </Alert>
      )}

      <Controller
        name="reserved_on"
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
                  startMonth={startOfToday()}
                  endMonth={addYears(today, 1)}
                  selected={parseISO(field.value)}
                  defaultMonth={parseISO(field.value)}
                  disabled={[{ before: startOfToday() }, ...takenDays]}
                  onSelect={(date) => {
                    field.onChange(format(date ?? new Date(), ISO_DAY))
                    setDateOpen(false)
                  }}
                />
              </PopoverPopup>
            </Popover>
            <FieldDescription>Los días ya apartados aparecen deshabilitados.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

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
                disabled={disabled || lockPaidFields}
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
            <FieldDescription>
              Se paga completo al reservar. Si la reservación es gratuita, deja el monto en $0.
            </FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

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
            <FieldDescription>Opcional. Motivo, horario, o cualquier acuerdo con la casa.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { addYears, format, parseISO, startOfToday } from 'date-fns'
import { ChevronsUpDownIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { HousesPicker } from '@/components/shared/pickers/houses-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { formatDay, ISO_DAY } from '@/lib/utils'
import type { HallReservationInput } from '@/lib/validations/presidency'
import { hallReservationsQueryOptions } from '@/tanstack-queries/presidency'

interface HallReservationFormFieldsProps {
  form: UseFormReturn<HallReservationInput>
  disabled?: boolean
  /** Editing: this booking's own day must stay selectable. */
  currentId?: string
}

/** Shared by the create and edit drawers. */
export function HallReservationFormFields({ form, disabled, currentId }: HallReservationFormFieldsProps) {
  const [isDateOpen, setDateOpen] = useState(false)
  const { data: reservations } = useQuery(hallReservationsQueryOptions())

  // Days already booked by someone else are greyed out; the DB enforces it
  // too (unique reserved_on), this just saves a failed submit.
  const takenDays = useMemo(
    () => (reservations ?? []).filter((r) => r.id !== currentId).map((r) => parseISO(r.reserved_on)),
    [reservations, currentId],
  )

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
              disabled={disabled}
            />
            <FieldDescription>La casa que aparta la terraza.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

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
                  endMonth={addYears(new Date(), 1)}
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

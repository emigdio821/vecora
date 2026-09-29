'use client'

import { useQuery } from '@tanstack/react-query'
import { addYears, format, parseISO, startOfToday } from 'date-fns'
import { ChevronsUpDownIcon, TriangleAlertIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { HousesPicker } from '@/components/shared/pickers/houses-picker'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToday } from '@/hooks/use-today'
import { formatDay, formatMonth, ISO_DAY, MONEY_FORMAT } from '@/lib/utils'
import type { HallReservationInput } from '@/lib/validations/presidency'
import { type HallReservationQueryData, hallReservationsQueryOptions } from '@/tanstack-queries/presidency'
import { houseFeeStatusQueryOptions } from '@/tanstack-queries/treasury'

interface HallReservationFormFieldsProps {
  form: UseFormReturn<HallReservationInput>
  disabled?: boolean
  /** Editing: this booking's own day must stay selectable. */
  currentId?: string
  /** Editing a paid booking: the ledger already has its house and amount. */
  lockPaidFields?: boolean
}

/** The latest fee charged, so the usual amount is one click away. */
function latestFee(reservations: HallReservationQueryData[] | undefined): number | undefined {
  const latest = reservations
    ?.filter((r) => Number(r.amount) > 0)
    .reduce<HallReservationQueryData | undefined>(
      (last, r) => (!last || r.created_at > last.created_at ? r : last),
      undefined,
    )
  return latest ? Number(latest.amount) : undefined
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
  const amount = useWatch({ control: form.control, name: 'amount' })
  const feeSwitchId = useId()

  // The terraza is free; some bookings carry an extra charge (e.g. electricity
  // for brincolines). Empty while switched on still counts as on, so the fee
  // field stays visible.
  const hasFee = amount !== 0
  const lastFee = useMemo(() => latestFee(reservations), [reservations])

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

      <div className="flex items-start gap-2">
        <Switch
          id={feeSwitchId}
          checked={hasFee}
          onCheckedChange={(checked) => {
            // Off means free; on starts from the usual fee, or empty to force one.
            form.setValue('amount', checked ? (lastFee ?? (null as unknown as number)) : 0, {
              shouldDirty: true,
            })
          }}
          disabled={disabled || lockPaidFields}
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor={feeSwitchId}>Agregar tarifa</Label>
          <p className="text-xs text-muted-foreground">
            La terraza es gratuita. Actívalo si hay un cobro extra, como el uso de electricidad para
            brincolines o inflables.
          </p>
        </div>
      </div>

      {hasFee && (
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
                Tarifa <span className="text-destructive">*</span>
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
                Se paga completo al reservar. Puedes anotar el motivo del cobro en "Notas".
              </FieldDescription>
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
            <Textarea {...field} rows={3} className="max-h-40" disabled={disabled} />
            <FieldDescription>Opcional. Motivo, horario, o cualquier acuerdo con la casa.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

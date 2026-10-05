import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { MONEY_FORMAT } from '@/lib/utils'
import type { AmenityInput } from '@/lib/validations/presidency'

interface AmenityFormFieldsProps {
  form: UseFormReturn<AmenityInput>
  disabled?: boolean
}

/** Shared by the create and edit drawers. */
export function AmenityFormFields({ form, disabled }: AmenityFormFieldsProps) {
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
            <FieldDescription>Como aparecerá en las reservaciones y en "Tesorería".</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        name="default_fee"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>Tarifa sugerida</FieldLabel>
            <InputGroup>
              <NumberField
                value={field.value ?? null}
                onValueChange={(value) => {
                  field.onChange(value ?? 0)
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
            <FieldDescription>
              Se propone al reservar y se puede cambiar en cada reservación. 0 si el área es gratuita.
            </FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

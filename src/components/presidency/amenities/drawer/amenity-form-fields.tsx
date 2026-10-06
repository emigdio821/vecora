import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupText } from '@/components/ui/input-group'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { useCurrency } from '@/hooks/use-currency'
import { currencySymbol, intlLocale, MONEY_FORMAT } from '@/lib/utils'
import type { AmenityInput } from '@/lib/validations/presidency'
import { m } from '@/paraglide/messages'

interface AmenityFormFieldsProps {
  form: UseFormReturn<AmenityInput>
  disabled?: boolean
}

/** Shared by the create and edit drawers. */
export function AmenityFormFields({ form, disabled }: AmenityFormFieldsProps) {
  // The suggested fee has no currency of its own: it's always in the current one.
  const currency = useCurrency()

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
              {m.common_field_name()} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} autoComplete="off" disabled={disabled} />
            <FieldDescription>{m.presidency_amenity_name_description()}</FieldDescription>
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
            <FieldLabel>{m.presidency_amenity_default_fee()}</FieldLabel>
            <InputGroup>
              <NumberField
                value={field.value ?? null}
                onValueChange={(value) => {
                  field.onChange(value ?? 0)
                }}
                min={0}
                locale={intlLocale()}
                format={MONEY_FORMAT}
                disabled={disabled}
              >
                <NumberFieldInput ref={field.ref} className="text-left" inputMode="decimal" />
              </NumberField>
              <InputGroupAddon>
                <InputGroupText>{currencySymbol(currency)}</InputGroupText>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupText>{currency}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>{m.presidency_amenity_default_fee_description()}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

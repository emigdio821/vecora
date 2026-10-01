import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CreateHouseInput } from '@/lib/validations/houses'

/** The two house fields, shared by the create and edit forms. */
export function HouseFormFields({ control }: { control: Control<CreateHouseInput> }) {
  return (
    <>
      <Controller
        name="number"
        control={control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              Número <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} autoComplete="off" />
            <FieldDescription>Identificador de la casa. Debe ser único.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>Notas</FieldLabel>
            <Textarea {...field} rows={3} className="max-h-40" />
            <FieldDescription>Visible para todos los miembros.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

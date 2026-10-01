import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroupPrimitive, RadioPrimitive } from '@/components/ui/radio-group'
import { segmentedControlItemVariants, segmentedControlRootClassName } from '@/lib/segmented-control'
import type { CategoryInput } from '@/lib/validations/treasury'
import { KIND_ITEMS } from '../../kind'

const kindItemClassName = segmentedControlItemVariants({ className: 'grow', state: 'checked' })

interface CategoryFormFieldsProps {
  form: UseFormReturn<CategoryInput>
  disabled?: boolean
  /** Editing: movements already point at the category, so its kind can't move. */
  lockKind?: boolean
}

/** Shared by the create and edit drawers. */
export function CategoryFormFields({ form, disabled, lockKind }: CategoryFormFieldsProps) {
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
              }}
            >
              {KIND_ITEMS.map((item) => (
                <RadioPrimitive.Root key={item.value} className={kindItemClassName} value={item.value}>
                  {item.label}
                </RadioPrimitive.Root>
              ))}
            </RadioGroupPrimitive>
            {lockKind && <FieldDescription>El tipo no se puede cambiar una vez creada.</FieldDescription>}
          </Field>
        )}
      />

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
            <FieldDescription>Como aparecerá en la lista de movimientos.</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

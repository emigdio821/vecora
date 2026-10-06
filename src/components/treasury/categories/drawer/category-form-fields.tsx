import { Controller, type UseFormReturn } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroupPrimitive, RadioPrimitive } from '@/components/ui/radio-group'
import { segmentedControlItemVariants, segmentedControlRootClassName } from '@/lib/segmented-control'
import type { CategoryInput } from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'
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
            <FieldLabel>{m.common_field_type()}</FieldLabel>
            <RadioGroupPrimitive
              className={segmentedControlRootClassName}
              aria-label={m.treasury_transaction_kind()}
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
            {lockKind && <FieldDescription>{m.treasury_category_kind_locked()}</FieldDescription>}
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
              {m.common_field_name()} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} autoComplete="off" disabled={disabled} />
            <FieldDescription>{m.treasury_category_name_description()}</FieldDescription>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />
    </>
  )
}

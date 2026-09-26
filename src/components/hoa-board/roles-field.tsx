'use client'

import { Controller, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckboxGroup } from '@/components/ui/checkbox-group'
import { Field, FieldDescription, FieldError, FieldItem, FieldLabel } from '@/components/ui/field'
import { Fieldset, FieldsetLegend } from '@/components/ui/fieldset'
import { getRoleLabel } from '@/lib/utils'
import { APP_ROLES, type AppRole } from '@/lib/validations/hoa-board'

const ROLE_DESCRIPTION: Record<AppRole, string> = {
  admin: 'Todo, incluyendo administrar la mesa directiva y otros administradores.',
  president: '"Residencial" (casas y residentes), "Presidencia" (periodos y terraza) y "Mesa directiva".',
  treasurer:
    '"Tesorería" (movimientos, cuotas y categorías), los periodos de "Presidencia" y pagar o rechazar las solicitudes de "Mantenimiento".',
  security: 'Solo lectura por ahora.',
  maintenance:
    'Envía solicitudes de pago en "Mantenimiento" y puede editarlas mientras estén pendientes. Solo lectura en las demás secciones.',
}

interface RolesFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  disabled?: boolean
  /** Only an admin can hand out the admin role. */
  canGrantAdmin: boolean
}

/** Multi-select of board positions; one checkbox per app role. */
export function RolesField<T extends FieldValues>({
  form,
  name,
  disabled,
  canGrantAdmin,
}: RolesFieldProps<T>) {
  const roles = canGrantAdmin ? APP_ROLES : APP_ROLES.filter((role) => role !== 'admin')

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field
          name={field.name}
          invalid={fieldState.invalid}
          touched={fieldState.isTouched}
          dirty={fieldState.isDirty}
          render={(props) => <Fieldset {...props} />}
        >
          <FieldsetLegend className="text-sm font-medium">
            Roles <span className="text-destructive">*</span>
          </FieldsetLegend>
          <CheckboxGroup
            className="gap-2"
            value={field.value as string[]}
            onValueChange={(value) => field.onChange(value)}
            disabled={disabled}
          >
            {roles.map((role) => (
              <FieldItem key={role} className="w-full">
                <FieldLabel className="flex w-full items-start rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
                  <Checkbox value={role} />
                  <span className="grid gap-1">
                    <span>{getRoleLabel(role)}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {ROLE_DESCRIPTION[role]}
                    </span>
                  </span>
                </FieldLabel>
              </FieldItem>
            ))}
          </CheckboxGroup>
          <FieldDescription>Una persona puede tener más de un rol.</FieldDescription>
          <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
        </Field>
      )}
    />
  )
}

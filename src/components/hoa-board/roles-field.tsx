import { Controller, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from '@/components/ui/combobox'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { getRoleLabel } from '@/lib/utils'
import { APP_ROLES, type AppRole } from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'

const ROLE_DESCRIPTION: Record<AppRole, string> = {
  get admin() {
    return m.board_role_description_admin()
  },
  get president() {
    return m.board_role_description_president()
  },
  get treasurer() {
    return m.board_role_description_treasurer()
  },
  get security() {
    return m.board_role_description_security()
  },
  get maintenance() {
    return m.board_role_description_maintenance()
  },
}

interface RolesFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  disabled?: boolean
  /** Only an admin can hand out the admin role. */
  canGrantAdmin: boolean
}

/** Multi-select of board positions: chips for the chosen roles, each role's description in the list. */
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
        >
          <FieldLabel>
            {m.board_roles()} <span className="text-destructive">*</span>
          </FieldLabel>
          <Combobox
            multiple
            items={roles}
            itemToStringLabel={getRoleLabel}
            autoHighlight
            value={field.value as AppRole[]}
            onValueChange={(value) => {
              field.onChange(value)
            }}
            inputRef={field.ref}
            disabled={disabled}
          >
            <ComboboxChips>
              <ComboboxValue>
                {(value: AppRole[]) => (
                  <>
                    {value.map((role) => (
                      <ComboboxChip
                        key={role}
                        aria-label={getRoleLabel(role)}
                        removeProps={{ 'aria-label': m.common_action_remove() }}
                      >
                        {getRoleLabel(role)}
                      </ComboboxChip>
                    ))}
                    <ComboboxChipsInput placeholder={value.length > 0 ? undefined : m.board_search_roles()} />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
            {/* As wide as the field: the descriptions wrap instead of stretching the list. */}
            <ComboboxPopup className="w-(--anchor-width)">
              <ComboboxEmpty>{m.common_no_results()}</ComboboxEmpty>
              <ComboboxList>
                {(role: AppRole) => (
                  <ComboboxItem key={role} value={role}>
                    <div className="grid gap-0.5">
                      <span>{getRoleLabel(role)}</span>
                      <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[role]}</span>
                    </div>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
          <FieldDescription>{m.board_roles_hint()}</FieldDescription>
          <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
        </Field>
      )}
    />
  )
}

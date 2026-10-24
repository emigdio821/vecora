import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconEye, IconEyeOff, IconLock, IconShieldCheck } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useCurrentUser } from '@/components/current-user-provider'
import { SettingsCard, SettingsGrid } from '@/components/settings/settings-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toastManager } from '@/components/ui/toast'
import { type ChangePasswordInput, changePasswordSchema } from '@/lib/validations/auth'
import { m } from '@/paraglide/messages'
import { changePassword } from '@/server-actions/auth'

const FORM_ID = 'account-settings-form'

/**
 * The settings page's Account tab, only for the main admin: its password.
 * Board members change theirs with a new access link from HOA board.
 */
export function AccountSettingsPanel() {
  const user = useCurrentUser()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: '', password: '', confirm: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: ChangePasswordInput) => {
      const result = await changePassword(values)
      if (result.error !== undefined) {
        throw new Error(result.error)
      }
    },
    onSuccess: () => {
      toastManager.add({ type: 'success', title: m.auth_password_changed() })
      form.reset()
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  const newType = showNew ? 'text' : 'password'

  return (
    <SettingsGrid>
      <SettingsCard
        title={m.auth_field_password()}
        description={m.settings_account_description({ email: user.email })}
        icon={IconLock}
        footer={
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            {m.auth_change_password()}
          </Button>
        }
      >
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <Controller
            name="current"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.auth_current_password()} <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={mutation.isPending}
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        setShowCurrent(!showCurrent)
                      }}
                      aria-label={showCurrent ? m.auth_hide_password() : m.auth_show_password()}
                    >
                      {showCurrent ? <IconEyeOff /> : <IconEye />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.auth_new_password()} <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    type={newType}
                    autoComplete="new-password"
                    disabled={mutation.isPending}
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        setShowNew(!showNew)
                      }}
                      aria-label={showNew ? m.auth_hide_password() : m.auth_show_password()}
                    >
                      {showNew ? <IconEyeOff /> : <IconEye />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>{m.auth_password_min_hint()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            name="confirm"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                name={field.name}
                invalid={fieldState.invalid}
                touched={fieldState.isTouched}
                dirty={fieldState.isDirty}
              >
                <FieldLabel>
                  {m.auth_repeat_password()} <span className="text-destructive">*</span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    type={newType}
                    autoComplete="new-password"
                    disabled={mutation.isPending}
                  />
                </InputGroup>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>{m.common_error()}</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>
      </SettingsCard>

      {/* Why this tab exists: the database guards it, see 20260921000000_profiles_and_roles.sql. */}
      <SettingsCard
        title={m.settings_main_account_title()}
        description={m.settings_main_account_description()}
        icon={IconShieldCheck}
      >
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{m.common_field_name()}</dt>
          <dd className="truncate">{user.name}</dd>
          <dt className="text-muted-foreground">{m.common_field_email()}</dt>
          <dd className="truncate">{user.email}</dd>
        </dl>
        <p className="text-sm text-muted-foreground">{m.settings_main_account_rules()}</p>
      </SettingsCard>
    </SettingsGrid>
  )
}

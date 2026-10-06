import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconEye, IconEyeOff } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { type LoginInput, loginSchema } from '@/lib/validations/auth'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import { login } from '@/server-actions/auth'
import { USER_QUERY_KEY } from '@/tanstack-queries/session'

export function LoginForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setLoading] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginInput) {
    setLoading(true)
    const result = await login(values)

    if (result?.error) {
      setLoading(false)
      form.setError('root', { message: result.error })
      return
    }

    // Now in the HOA's language: a full load renders the app in it.
    if (result?.locale && result.locale !== getLocale()) {
      window.location.replace('/')
      return
    }

    // The cache still holds the signed-out user; the guards must ask again.
    queryClient.removeQueries({ queryKey: [USER_QUERY_KEY] })
    await navigate({ to: '/', replace: true })
  }

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field
            name={field.name}
            invalid={fieldState.invalid}
            touched={fieldState.isTouched}
            dirty={fieldState.isDirty}
          >
            <FieldLabel>
              {m.common_field_email()}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} inputMode="email" autoComplete="email" />
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
              {m.auth_field_password()}
              <span className="text-destructive">*</span>
            </FieldLabel>

            <InputGroup>
              <InputGroupInput
                type={showPassword ? 'text' : 'password'}
                aria-label={m.auth_password_toggle_label()}
                {...field}
              />
              <InputGroupAddon align="inline-end">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => {
                    setShowPassword(!showPassword)
                  }}
                  aria-label={showPassword ? m.auth_hide_password() : m.auth_show_password()}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </Button>
              </InputGroupAddon>
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

      <Button type="submit" disabled={isLoading} loading={isLoading}>
        {m.auth_login_submit()}
      </Button>
    </Form>
  )
}

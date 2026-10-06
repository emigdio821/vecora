import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconEye, IconEyeOff } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toastManager } from '@/components/ui/toast'
import { type SetPasswordInput, setPasswordSchema } from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'
import { setPassword } from '@/server-actions/hoa-board'
import { USER_QUERY_KEY } from '@/tanstack-queries/session'

export function SetPasswordForm() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setLoading] = useState(false)

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: SetPasswordInput) => {
      setLoading(true)
      const result = await setPassword(values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: async () => {
      toastManager.add({ type: 'success', title: m.auth_password_saved() })
      // The new session no longer needs a password; the guards must see that.
      queryClient.removeQueries({ queryKey: [USER_QUERY_KEY] })
      await navigate({ to: '/', replace: true })
    },
    onError: (error) => {
      setLoading(false)
      form.setError('root', { message: error.message })
    },
  })

  const type = showPassword ? 'text' : 'password'

  return (
    <Form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
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
              <InputGroupInput {...field} type={type} autoComplete="new-password" />
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
              <InputGroupInput {...field} type={type} autoComplete="new-password" />
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
        {m.auth_save_password()}
      </Button>
    </Form>
  )
}

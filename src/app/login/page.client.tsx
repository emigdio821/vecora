'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { type LoginInput, loginSchema } from '@/lib/validations/auth'
import { login } from '@/server-actions/auth'

export function LoginPageClient() {
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
    }
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
              Correo
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input {...field} type="email" autoComplete="email" />
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
              Contraseña
              <span className="text-destructive">*</span>
            </FieldLabel>

            <InputGroup>
              <InputGroupInput
                type={showPassword ? 'text' : 'password'}
                aria-label="Contraseña con alternar visibilidad"
                {...field}
              />
              <InputGroupAddon align="inline-end">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => {
                    setShowPassword(!showPassword)
                  }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </InputGroupAddon>
            </InputGroup>
            <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {form.formState.errors.root && (
        <Alert variant="error">
          <CircleAlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading} loading={isLoading}>
        Inicia sesión
      </Button>
    </Form>
  )
}

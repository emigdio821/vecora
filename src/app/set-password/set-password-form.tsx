'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toastManager } from '@/components/ui/toast'
import { type SetPasswordInput, setPasswordSchema } from '@/lib/validations/hoa-board'
import { setPassword } from '@/server-actions/hoa-board'

export function SetPasswordForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: SetPasswordInput) => {
      const result = await setPassword(values)
      if (result.error !== undefined) throw new Error(result.error)
    },
    onSuccess: () => {
      toastManager.add({ type: 'success', title: 'Contraseña guardada', description: 'Bienvenido a Vecora' })
      router.replace('/')
    },
    onError: (error) => {
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
              Nueva contraseña <span className="text-destructive">*</span>
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
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>Mínimo 8 caracteres.</FieldDescription>
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
              Repite la contraseña <span className="text-destructive">*</span>
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
          <CircleAlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={mutation.isPending} loading={mutation.isPending}>
        Guardar contraseña
      </Button>
    </Form>
  )
}

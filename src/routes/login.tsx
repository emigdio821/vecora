import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SITE_CONFIG } from '@/config/site'
import { authClient } from '@/lib/auth-client'
import { createSEOTitle } from '@/lib/seo'
import { getServerSession } from '@/server-fns/session'

const loginSchema = z.object({
  email: z.email().min(1, 'El email es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const Route = createFileRoute('/login')({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await getServerSession()

    if (session) {
      throw redirect({ to: '/' })
    }
  },
  head: () => ({
    meta: [{ title: createSEOTitle('Iniciar sesión') }],
  }),
})

function RouteComponent() {
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: '/',
      })

      if (result.error) {
        setError(result.error.message || 'Invalid credentials')
      }
    } catch {
      setLoading(false)
      setError('An unexpected error occurred')
    }
  }

  return (
    <Card className="m-4 mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">Iniciar sesión</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <span>Bienvenido a {SITE_CONFIG.title}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Correo</FieldLabel>
                  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} disabled={isLoading} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    disabled={isLoading}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          {error && <div className="mt-4 text-destructive text-sm">{error}</div>}
        </form>
      </CardContent>

      <CardFooter className="pt-4 text-center">
        <Button type="submit" form="login-form" className="w-full" disabled={isLoading}>
          Iniciar sesión
          {isLoading && <LoaderIcon />}
        </Button>
      </CardFooter>
    </Card>
  )
}

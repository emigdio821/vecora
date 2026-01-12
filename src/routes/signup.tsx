import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createUserWithProfile } from '@/server-functions/test'

const signupSchema = z.object({
  email: z.email('Email inválido').min(1, 'El email es obligatorio'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  address: z.string().optional(),
  userType: z.enum(['owner', 'external']),
  roleId: z.string().min(1, 'Debes seleccionar un rol'),
  existingOwnerId: z.string().optional(),
})

export type SignupFormData = z.infer<typeof signupSchema>

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: 'Sign Up' }],
  }),
})

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      userType: 'owner',
      roleId: '',
      existingOwnerId: '',
    },
  })

  const userType = form.watch('userType')

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const result = await createUserWithProfile({
        data: {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address,
          userType: data.userType,
          roleId: data.roleId,
          existingOwnerId: data.existingOwnerId,
        },
      })

      if (result.success) {
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Crear cuenta</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <span>Regístrate para comenzar</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <div className="text-green-600 text-sm">¡Cuenta creada exitosamente! Redirigiendo...</div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
                      <Input
                        {...field}
                        id="firstName"
                        type="text"
                        placeholder="Juan"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="lastName">Apellido</FieldLabel>
                      <Input
                        {...field}
                        id="lastName"
                        type="text"
                        placeholder="Pérez"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="phone">Teléfono (opcional)</FieldLabel>
                      <Input
                        {...field}
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="address">Dirección (opcional)</FieldLabel>
                      <Input
                        {...field}
                        id="address"
                        type="text"
                        placeholder="Calle 123, Ciudad"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="userType"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="userType">Tipo de Usuario</FieldLabel>
                      <select
                        {...field}
                        id="userType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      >
                        <option value="owner">Propietario</option>
                        <option value="external">Usuario Externo</option>
                      </select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="roleId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="roleId">Rol</FieldLabel>
                      <select
                        {...field}
                        id="roleId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-invalid={fieldState.invalid}
                        disabled={isLoading}
                      >
                        <option value="">Seleccionar rol...</option>
                        <option value="admin">Administrador</option>
                        <option value="president">Presidente</option>
                        <option value="treasurer">Tesorero</option>
                        <option value="maintainer">Mantenimiento</option>
                        <option value="security">Seguridad</option>
                      </select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {userType === 'owner' && (
                  <Controller
                    name="existingOwnerId"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="existingOwnerId">Propietario Existente (opcional)</FieldLabel>
                        <select
                          {...field}
                          id="existingOwnerId"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-invalid={fieldState.invalid}
                          disabled={isLoading}
                        >
                          <option value="">Crear nuevo propietario</option>
                          {/* TODO: Load existing owners from API */}
                        </select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                )}
              </FieldGroup>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>

              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

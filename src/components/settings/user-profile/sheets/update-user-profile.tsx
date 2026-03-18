import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { USER_PROFILE_QUERY_KEY, type UserProfileQueryData } from '@/api/tanstack-queries/user'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/ui/input-password'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { authClient } from '@/lib/auth/client'
import { type UpdateUserProfileFormData, updateUserProfileSchema } from '@/schemas/user-profile'

interface UpdateUserProfileSheetProps extends React.ComponentProps<typeof Sheet> {
  profile: UserProfileQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateUserProfileSheet({
  profile,
  open,
  onOpenChange,
  ...props
}: UpdateUserProfileSheetProps) {
  const updateResidentialAddressFormId = useId()

  const form = useForm<UpdateUserProfileFormData>({
    resolver: zodResolver(updateUserProfileSchema),
    values: {
      name: profile?.user.name || '',
      email: profile?.user.email || '',
      password: '',
      newPassword: '',
    },
  })

  const updateResidentialAddressMutation = useEntityMutation({
    mutationFn: async (data: UpdateUserProfileFormData) => {
      await authClient.updateUser({
        name: data.name,
        fetchOptions: {
          onError: (error) => {
            throw error
          },
        },
      })

      if (profile?.user.email !== data.email) {
        await authClient.changeEmail({
          newEmail: data.email,
          fetchOptions: {
            onError: (error) => {
              throw error
            },
          },
        })
      }

      if (data.password && data.newPassword) {
        await authClient.changePassword({
          currentPassword: data.password,
          newPassword: data.newPassword,
          revokeOtherSessions: true,
          fetchOptions: {
            onError: (error) => {
              throw error
            },
          },
        })
      }
    },
    invalidateKeys: [USER_PROFILE_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil actualizado',
    successDescription: 'El perfil ha sido actualizado exitosamente',
    errorDescription: 'Ocurrió un error al actualizar el perfil, intenta nuevamente',
    onSuccess: () => onOpenChange(false),
  })

  function onSubmit(data: UpdateUserProfileFormData) {
    updateResidentialAddressMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateResidentialAddressMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset()
      }}
      {...props}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Actualizar perfil</SheetTitle>
          <SheetDescription>Actualiza la información de tu perfil</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={updateResidentialAddressFormId}
            aria-label="Editar dirección residencial"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
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
                  <FieldLabel htmlFor={field.name}>Correo</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
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
                  <FieldLabel htmlFor={field.name}>Contraseña actual</FieldLabel>
                  <InputPassword
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Nueva contraseña</FieldLabel>
                  <InputPassword
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={updateResidentialAddressMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button
            type="submit"
            form={updateResidentialAddressFormId}
            disabled={updateResidentialAddressMutation.isPending}
          >
            {updateResidentialAddressMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

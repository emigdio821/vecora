import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateProfile } from '@/api/server-functions/profiles'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PROFILES_QUERY_KEY, type ProfileQueryData } from '@/api/tanstack-queries/profiles'
import { LoaderIcon } from '@/components/icons'
import { ResidentsSelector } from '@/components/shared/selectors/residents-selector'
import { RolesSelector } from '@/components/shared/selectors/roles-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
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
import { type UpdateProfileFormData, updateProfileSchema } from '@/schemas/profiles'
import { Role } from '@/types/rbac'

interface EditProfileSheetProps {
  profile: ProfileQueryData
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function EditProfileSheet({ profile, state }: EditProfileSheetProps) {
  const editProfileFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      password: '',
      profileId: profile.id,
      userId: profile.userId,
      residentId: profile.residentId ?? '',
      role: (profile.user.role as Role) || Role.RESIDENT,
    },
  })

  const updateProfileMutation = useEntityMutation({
    mutationFn: async (data: UpdateProfileFormData) => {
      return await updateProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil actualizado',
    successDescription: 'El perfil ha sido actualizado exitosamente',
    errorDescription: 'Ocurrió un error al actualizar el perfil, intenta nuevamente',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: UpdateProfileFormData) {
    updateProfileMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (updateProfileMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) form.reset()
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar perfil</SheetTitle>
          <SheetDescription>Actualiza la información del perfil</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editProfileFormId}
            aria-label="Editar perfil"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="residentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Propietario <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ResidentsSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    disabled={updateProfileMutation.isPending}
                    invalid={fieldState.invalid}
                    includeNoneOption={false}
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
                  <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                  <InputPassword
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Mínimo 8 caracteres"
                    disabled={updateProfileMutation.isPending}
                  />
                  <FieldDescription>Dejar en blanco para mantener la actual</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Rol <span className="text-destructive">*</span>
                  </FieldLabel>
                  <RolesSelector
                    id={field.name}
                    includeNoneOption={false}
                    invalid={fieldState.invalid}
                    value={field.value}
                    disabled={updateProfileMutation.isPending}
                    onValueChange={field.onChange}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button type="submit" form={editProfileFormId} disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending && <LoaderIcon />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

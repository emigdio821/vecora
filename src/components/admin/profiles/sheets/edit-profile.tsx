import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateProfile } from '@/api/server-functions/profiles'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PROFILES_QUERY_KEY } from '@/api/tanstack-queries/profiles'
import { LoaderIcon } from '@/components/icons'
import { ExternalUsersSelector } from '@/components/shared/selectors/external-users-selector'
import { OwnersSelector } from '@/components/shared/selectors/owners-selector'
import { ProfileTypeSelector } from '@/components/shared/selectors/profile-type-selector'
import { RolesSelector } from '@/components/shared/selectors/roles-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { InputPassword } from '@/components/ui/input-password'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { ProfileType, ProfileWithAllRelations } from '@/db/schemas/zod/profiles'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type UpdateProfileFormData, updateProfileSchema } from '@/schemas/profiles'

interface EditProfileSheetProps {
  profile: ProfileWithAllRelations
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
      profileType: profile.profileType,
      ownerId: profile.ownerId,
      externalUserId: profile.externalUserId,
      roleIds: profile.profileRoles.map((pr) => pr.roleId),
    },
  })

  const updateProfileMutation = useEntityMutation({
    mutationFn: async (data: UpdateProfileFormData) => {
      return await updateProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil actualizado',
    successDescription: 'El perfil ha sido actualizado exitosamente.',
    errorDescription: 'Ocurrió un error al actualizar el perfil, intenta nuevamente.',
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

  const profileType = form.watch('profileType', profile.profileType || 'owner')

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
          <SheetDescription>Actualiza la información del perfil.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={editProfileFormId}
            aria-label="Editar perfil"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              name="profileType"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Tipo de perfil</FieldLabel>
                  <ProfileTypeSelector
                    id={field.name}
                    value={field.value}
                    includeNoneOption={false}
                    onValueChange={(value) => {
                      field.onChange(value as ProfileType)
                      form.setValue('ownerId', null)
                      form.setValue('externalUserId', null)
                    }}
                    disabled={updateProfileMutation.isPending}
                  />
                </Field>
              )}
            />

            <div className="space-y-2">
              {profileType === 'owner' && (
                <Controller
                  name="ownerId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Propietario <span className="text-destructive">*</span>
                      </FieldLabel>
                      <OwnersSelector
                        id={field.name}
                        value={field.value}
                        onValueChange={(value) => {
                          form.setValue('externalUserId', null)
                          form.setValue('ownerId', value)
                          field.onChange(value)
                        }}
                        disabled={updateProfileMutation.isPending}
                        invalid={fieldState.invalid || !!form.formState.errors.profileType}
                        includeNoneOption={false}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              {profileType === 'external' && (
                <Controller
                  name="externalUserId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Usuario Externo <span className="text-destructive">*</span>
                      </FieldLabel>
                      <ExternalUsersSelector
                        id={field.name}
                        value={field.value}
                        onValueChange={(value) => {
                          form.setValue('ownerId', null)
                          form.setValue('externalUserId', value)
                          field.onChange(value)
                        }}
                        disabled={updateProfileMutation.isPending}
                        invalid={fieldState.invalid || !!form.formState.errors.profileType}
                        includeNoneOption={false}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              {form.formState.errors.profileType && (
                <FieldError errors={[form.formState.errors.profileType]} />
              )}
            </div>

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
              name="roleIds"
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
                    value={field.value[0] || null}
                    disabled={updateProfileMutation.isPending}
                    onValueChange={(value) => field.onChange([value])}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <SheetClose
            render={
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            }
          />
          <Button type="submit" form={editProfileFormId} disabled={updateProfileMutation.isPending}>
            Guardar cambios
            {updateProfileMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

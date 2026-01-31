import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createProfile } from '@/api/server-functions/profiles'
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
import type { ProfileType } from '@/db/schemas/zod/profiles'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type CreateProfileFormData, createProfileSchema } from '@/schemas/profiles'

interface CreateProfileSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateProfileSheet({ state }: CreateProfileSheetProps) {
  const createProfileFormId = useId()
  const { isOpen, onOpenChange } = state

  const form = useForm<CreateProfileFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      password: '',
      profileType: 'owner',
      ownerId: null,
      externalUserId: null,
      roleIds: [],
    },
  })

  const createProfileMutation = useEntityMutation({
    mutationFn: async (data: CreateProfileFormData) => {
      return await createProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Perfil creado',
    successDescription: 'El perfil ha sido creado exitosamente.',
    errorDescription: 'Ocurrió un error al crear el perfil, intenta nuevamente.',
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  function onSubmit(data: CreateProfileFormData) {
    createProfileMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createProfileMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Crear perfil</SheetTitle>
          <SheetDescription>Ingresa la información del nuevo perfil.</SheetDescription>
        </SheetHeader>

        <SheetPanel>
          <form
            className="space-y-4"
            id={createProfileFormId}
            aria-label="Crear perfil"
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
                    disabled={createProfileMutation.isPending}
                  />
                  <FieldDescription>
                    Si el propietario o usuario externo no está listado, tienes que crear un{' '}
                    <Button
                      nativeButton={false}
                      variant="link"
                      render={
                        <Link
                          to="/admin/residential"
                          search={{
                            tab: 'owners',
                          }}
                        >
                          propietario
                        </Link>
                      }
                    />{' '}
                    o{' '}
                    <Button
                      nativeButton={false}
                      variant="link"
                      render={
                        <Link
                          onClick={() => onOpenChange(false)}
                          to="."
                          search={{
                            tab: 'external-users',
                          }}
                        >
                          usuario externo
                        </Link>
                      }
                    />
                    , y después venir a vincularlo aquí.
                  </FieldDescription>
                  {/* {fieldState.invalid && <FieldError errors={[fieldState.error]} />} */}
                </Field>
              )}
            />

            <div className="space-y-2">
              {form.watch('profileType') === 'owner' && (
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
                          form.trigger('profileType')
                        }}
                        disabled={createProfileMutation.isPending}
                        invalid={fieldState.invalid || !!form.formState.errors.profileType}
                        includeNoneOption={false}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              )}

              {form.watch('profileType') === 'external' && (
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
                          form.trigger('profileType')
                        }}
                        disabled={createProfileMutation.isPending}
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
                  <FieldLabel htmlFor={field.name}>
                    Contraseña <span className="text-destructive">*</span>
                  </FieldLabel>
                  <InputPassword
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Mínimo 8 caracteres"
                    disabled={createProfileMutation.isPending}
                  />
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
                    disabled={createProfileMutation.isPending}
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
          <Button type="submit" form={createProfileFormId} disabled={createProfileMutation.isPending}>
            Crear perfil
            {createProfileMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

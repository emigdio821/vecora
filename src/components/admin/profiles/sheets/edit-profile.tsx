import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { updateProfile } from '@/api/server-functions/profiles'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { externalUsersListQueryOptions } from '@/api/tanstack-queries/external-users'
import { ownersListQueryOptions } from '@/api/tanstack-queries/owners'
import { PROFILES_QUERY_KEY } from '@/api/tanstack-queries/profiles'
import { LoaderIcon } from '@/components/icons'
import { RolesSelector } from '@/components/shared/selectors/roles-selector'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import { type UpdateProfileFormData, updateProfileSchema } from '@/schemas/profiles'

interface EditProfileSheetProps {
  profile: ProfileWithAllRelations
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

// TODO: Finish this component

export function EditProfileSheet({ profile, state }: EditProfileSheetProps) {
  const editProfileFormId = useId()
  const { isOpen, onOpenChange } = state

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())
  const { data: externalUsers = [], isLoading: isLoadingExternalUsers } = useQuery(
    externalUsersListQueryOptions(),
  )

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    values: {
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

  function handleProfileTypeChange(value: 'owner' | 'external') {
    form.setValue('profileType', value)
    form.setValue('ownerId', null)
    form.setValue('externalUserId', null)
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
              name="userId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ID de Usuario <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="ID del usuario de autenticación"
                    aria-invalid={fieldState.invalid}
                    disabled={updateProfileMutation.isPending}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="profileType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Tipo de perfil <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => handleProfileTypeChange(value as 'owner' | 'external')}
                    disabled={updateProfileMutation.isPending}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                      <SelectValue>
                        {field.value === 'owner'
                          ? 'Propietario'
                          : field.value === 'external'
                            ? 'Externo'
                            : 'Selecciona un tipo'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="owner">Propietario</SelectItem>
                        <SelectItem value="external">Externo</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {form.watch('profileType') === 'owner' && (
              <Controller
                name="ownerId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Propietario <span className="text-destructive">*</span>
                    </FieldLabel>
                    {isLoadingOwners ? (
                      <Skeleton className="h-8 w-full rounded-lg" />
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={updateProfileMutation.isPending || owners.length === 0}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                          <SelectValue>
                            {owners.length === 0
                              ? 'No hay propietarios disponibles'
                              : field.value
                                ? `${owners.find((o) => o.id === field.value)?.firstName} ${owners.find((o) => o.id === field.value)?.lastName}`
                                : 'Selecciona un propietario'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {owners.map((owner) => (
                              <SelectItem key={owner.id} value={owner.id}>
                                {`${owner.firstName} ${owner.lastName}`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
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
                    {isLoadingExternalUsers ? (
                      <Skeleton className="h-8 w-full rounded-lg" />
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={updateProfileMutation.isPending || externalUsers.length === 0}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                          <SelectValue>
                            {externalUsers.length === 0
                              ? 'No hay usuarios externos disponibles'
                              : field.value
                                ? `${externalUsers.find((u) => u.id === field.value)?.firstName} ${externalUsers.find((u) => u.id === field.value)?.lastName}`
                                : 'Selecciona un usuario externo'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {externalUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {`${user.firstName} ${user.lastName}`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            <Controller
              name="roleIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Roles <span className="text-destructive">*</span>
                  </FieldLabel>
                  <RolesSelector
                    id={field.name}
                    value={field.value[0]}
                    includeNoneOption={false}
                    invalid={fieldState.invalid}
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

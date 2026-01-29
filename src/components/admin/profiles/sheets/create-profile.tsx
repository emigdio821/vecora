import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createProfile } from '@/api/server-functions/profiles'
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

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())
  const { data: externalUsers = [], isLoading: isLoadingExternalUsers } = useQuery(
    externalUsersListQueryOptions(),
  )

  const form = useForm<CreateProfileFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      userId: '',
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

  function handleProfileTypeChange(value: 'owner' | 'external') {
    form.setValue('profileType', value)
    form.setValue('ownerId', null)
    form.setValue('externalUserId', null)
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
                    disabled={createProfileMutation.isPending}
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
                    disabled={createProfileMutation.isPending}
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
                        disabled={createProfileMutation.isPending || owners.length === 0}
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
                        disabled={createProfileMutation.isPending || externalUsers.length === 0}
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
                    disabled={createProfileMutation.isPending}
                    onValueChange={(value) => field.onChange([value])}
                  />
                  {/* <Combobox
                    multiple
                    items={roleItems}
                    disabled={createProfileMutation.isPending}
                    value={roleItems.filter((item) => field.value.includes(item.value))}
                    onValueChange={(selectedItems: { label: string; value: string }[]) => {
                      field.onChange(selectedItems.map((item) => item.value))
                    }}
                  >
                    <ComboboxChips ref={anchor} className="w-full">
                      <ComboboxValue>
                        {(values: { label: string; value: string }[]) => (
                          <>
                            {values.map((value) => (
                              <ComboboxChip key={value.value}>{value.label}</ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              id={field.name}
                              aria-invalid={fieldState.invalid}
                              placeholder={field.value.length > 0 ? undefined : 'Selecciona roles'}
                            />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={anchor}>
                      <ComboboxEmpty>No se encontraron roles.</ComboboxEmpty>
                      <ComboboxList>
                        {(item: { label: string; value: string }) => (
                          <ComboboxItem key={item.value} value={item}>
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox> */}
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

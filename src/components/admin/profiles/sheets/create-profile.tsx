import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { createProfile } from '@/api/server-functions/profiles'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { PROFILES_QUERY_KEY } from '@/api/tanstack-queries/profiles'
import { RESIDENTS_QUERY_KEY } from '@/api/tanstack-queries/residents'
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
import { type CreateProfileFormData, createProfileSchema } from '@/schemas/profiles'
import { Role } from '@/types/rbac'

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
      residentId: '',
      role: Role.RESIDENT,
    },
  })

  const createProfileMutation = useEntityMutation({
    mutationFn: async (data: CreateProfileFormData) => {
      return await createProfile({ data })
    },
    invalidateKeys: [PROFILES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY, RESIDENTS_QUERY_KEY],
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
              name="residentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Residente <span className="text-destructive">*</span>
                  </FieldLabel>
                  <ResidentsSelector
                    id={field.name}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                    disabled={createProfileMutation.isPending}
                    invalid={fieldState.invalid}
                    includeNoneOption={false}
                    excludeWithProfiles
                  />

                  <FieldDescription>
                    Si el residente no está listado, puedes{' '}
                    <Button
                      nativeButton={false}
                      variant="link"
                      render={
                        <Link
                          to="/admin/residential"
                          search={{
                            tab: 'residents',
                          }}
                        >
                          crearlo
                        </Link>
                      }
                    />{' '}
                    , y regresar a vincularlo aquí.
                  </FieldDescription>

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

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
                  <FieldDescription>
                    Puedes usar una contraseña temporal, el residente podrá cambiarla después desde su perfil.
                  </FieldDescription>

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
                    disabled={createProfileMutation.isPending}
                    onValueChange={field.onChange}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </form>
        </SheetPanel>

        <SheetFooter>
          <Button type="submit" form={createProfileFormId} disabled={createProfileMutation.isPending}>
            {createProfileMutation.isPending && <LoaderIcon />}
            Crear
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

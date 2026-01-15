import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
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
  SheetTitle,
} from '@/components/ui/sheet'
import { AVAILABLE_HOUSES_QUERY_KEY, availableHousesQueryOptions } from '@/lib/ts-queries/houses'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import { type CreateOwnerFormData, createOwner, createOwnerSchema } from '@/server-fns/owners'

interface CreateOwnerDialogProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateOwnerSheet({ state }: CreateOwnerDialogProps) {
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

  const { data: availableHouses = [], isLoading: isLoadingAvailableHouses } = useQuery(
    availableHousesQueryOptions(),
  )

  const form = useForm<CreateOwnerFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      houseId: null,
    },
  })

  const createOwnerMutation = useMutation({
    mutationFn: async (data: CreateOwnerFormData) => {
      return await createOwner({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [AVAILABLE_HOUSES_QUERY_KEY] })
      onOpenChange(false)
      form.reset()
      toast.success('Propietario creado exitosamente.')
    },
    onError: () => {
      toast.error('Ocurrió un error al crear el propietario, intenta nuevamente.')
    },
  })

  function onSubmit(data: CreateOwnerFormData) {
    createOwnerMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createOwnerMutation.isPending) return
    onOpenChange(open)
  }

  function renderAvailableHousesValue(value: string | null) {
    return availableHouses.find((house) => house.id === value)?.houseNumber ?? 'Selecciona una opción'
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear nuevo propietario</SheetTitle>
          <SheetDescription>Ingresa la información del nuevo propietario.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <form id="create-owner-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="px-4">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Nombre <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      disabled={createOwnerMutation.isPending}
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
                    <FieldLabel htmlFor={field.name}>
                      Apellido <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      disabled={createOwnerMutation.isPending}
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
                    <FieldLabel htmlFor={field.name}>
                      Teléfono <span className="text-destructive">*</span>
                    </FieldLabel>
                    <PhoneInput
                      id={field.name}
                      onBlur={field.onBlur}
                      onChange={(value) => {
                        field.onChange(value || '')
                      }}
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
                    <FieldLabel htmlFor={field.name}>
                      Correo <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      type="email"
                      id={field.name}
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      disabled={createOwnerMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="houseId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Casa</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={availableHouses.length === 0 || isLoadingAvailableHouses}
                    >
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        {availableHouses.length === 0 ? (
                          'No hay casas disponibles'
                        ) : (
                          <SelectValue>{renderAvailableHousesValue}</SelectValue>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={null}>Selecciona una opción</SelectItem>
                          {availableHouses.map((house) => (
                            <SelectItem key={house.id} value={house.id}>
                              {house.houseNumber}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <SheetClose
            render={
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            }
          />
          <Button type="submit" form="create-owner-form" disabled={createOwnerMutation.isPending}>
            Crear propietario
            {createOwnerMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

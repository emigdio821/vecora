import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
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
  SheetTitle,
} from '@/components/ui/sheet'
import { HOUSES_LIST_QUERY_KEY } from '@/lib/ts-queries/houses'
import { ownersListQueryOptions } from '@/lib/ts-queries/owners'
import { type CreateHouseFormData, createHouse, createHouseSchema } from '@/server-fns/houses'

interface CreateHouseDialogProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function CreateHouseSheet({ state }: CreateHouseDialogProps) {
  const createHouseFormId = useId()
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery(ownersListQueryOptions())

  const form = useForm<CreateHouseFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createHouseSchema),
    defaultValues: {
      houseNumber: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      ownerId: null,
    },
  })

  const createHouseMutation = useMutation({
    mutationFn: async (data: CreateHouseFormData) => {
      return await createHouse({ data })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HOUSES_LIST_QUERY_KEY] })
      onOpenChange(false)
      toast.success('Casa creada exitosamente.')
    },
    onError: () => {
      toast.error('Ocurrió un error al crear la casa, intenta nuevamente.')
    },
  })

  function onSubmit(data: CreateHouseFormData) {
    createHouseMutation.mutate(data)
  }

  function handleOpenChange(open: boolean) {
    if (createHouseMutation.isPending) return
    onOpenChange(open)
  }

  function renderOwnerValue(value: string | null) {
    if (owners.length === 0) return 'No hay propietarios disponibles'

    const owner = owners.find((owner) => owner.id === value)
    return owner ? `${owner.firstName} ${owner.lastName}` : 'Selecciona una opción'
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear nueva casa</SheetTitle>
          <SheetDescription>Ingresa la información de la nueva casa.</SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <form id={createHouseFormId} onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="px-4">
              <Controller
                name="houseNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Número de casa <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      disabled={createHouseMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="street"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Calle</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      disabled={createHouseMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Ciudad</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      disabled={createHouseMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      disabled={createHouseMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="zipCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Código postal</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      disabled={createHouseMutation.isPending}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="ownerId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Propietario</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={owners.length === 0 || isLoadingOwners}
                    >
                      <SelectTrigger id={field.name} aria-invalid={fieldState.invalid} className="w-full">
                        <SelectValue>{renderOwnerValue}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={null}>Selecciona una opción</SelectItem>
                          {owners.map((owner) => (
                            <SelectItem key={owner.id} value={owner.id}>
                              <span>{`${owner.firstName} ${owner.lastName}`}</span>
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
          <Button type="submit" form={createHouseFormId} disabled={createHouseMutation.isPending}>
            Crear casa
            {createHouseMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Controller, useForm } from 'react-hook-form'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'
import { LoaderIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { insertOwnerSchema } from '@/db/schemas/zod'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'

interface CreateOwnerDialogProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

const createOwnerFormSchema = insertOwnerSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
    lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
    phone: z
      .string()
      .min(1, 'El teléfono es requerido')
      .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
    email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
    address: z.string().max(500, 'La dirección es muy larga').optional().or(z.literal('')),
  })

type CreateOwnerFormData = z.infer<typeof createOwnerFormSchema>

export function CreateOwnerSheet({ state }: CreateOwnerDialogProps) {
  const { isOpen, onOpenChange } = state
  const queryClient = useQueryClient()

  const form = useForm<CreateOwnerFormData>({
    shouldUnregister: true,
    resolver: zodResolver(createOwnerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
    },
  })

  const createOwnerMutation = useMutation({
    mutationFn: async (data: CreateOwnerFormData) => {
      const response = await axios.post('/api/owners', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
      form.reset()
      onOpenChange(false)
    },
  })

  const onSubmit = async (data: CreateOwnerFormData) => {
    createOwnerMutation.mutate(data)
  }

  const handleOpenChange = (open: boolean) => {
    if (createOwnerMutation.isPending) return
    onOpenChange(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear nuevo propietario</SheetTitle>
          <SheetDescription>Complete la información del nuevo propietario.</SheetDescription>
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
                    <PhoneInput id={field.name} onBlur={field.onBlur} onChange={field.onChange} />
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
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Dirección</FieldLabel>
                    <Textarea
                      {...field}
                      rows={3}
                      id={field.name}
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                      disabled={createOwnerMutation.isPending}
                    />
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
            {!createOwnerMutation.isPending && <LoaderIcon />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

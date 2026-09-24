'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { PhoneInput } from '@/components/shared/phone-input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { DrawerPrimitive } from '@/components/ui/drawer'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toastManager } from '@/components/ui/toast'
import { type CreateResidentInput, createResidentSchema } from '@/lib/validations/residents'
import { createResident } from '@/server-actions/residents'
import { RESIDENTS_QUERY_KEY } from '@/tanstack-queries/residents'

const FORM_ID = 'create-resident-form'

const defaultValues: CreateResidentInput = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  notes: '',
}

interface CreateResidentDrawerProps extends React.ComponentProps<typeof Drawer> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateResidentDrawer({ open, onOpenChange, ...props }: CreateResidentDrawerProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateResidentInput>({
    resolver: zodResolver(createResidentSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: async (values: CreateResidentInput) => {
      const result = await createResident(values)
      if (result.error !== undefined) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: 'Residente creado',
        description: `${values.first_name} ${values.last_name} se agregó al directorio.`,
      })
      onOpenChange(false)
    },
    onError: (error) => {
      form.setError('root', { message: error.message })
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  function handleOpenChangeComplete(isOpen: boolean) {
    if (props.onOpenChangeComplete) {
      props.onOpenChangeComplete(isOpen)
    }

    if (!isOpen) {
      form.reset(defaultValues)
    }
  }

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      {...props}
    >
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>Nuevo residente</DrawerTitle>
          <DrawerDescription>
            Agrega una persona al directorio. Podrás asignarle una casa después.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerPanel>
          <Form
            id={FORM_ID}
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="first_name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    name={field.name}
                    invalid={fieldState.invalid}
                    touched={fieldState.isTouched}
                    dirty={fieldState.isDirty}
                  >
                    <FieldLabel>
                      Nombre <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input {...field} autoComplete="given-name" />
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="last_name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    name={field.name}
                    invalid={fieldState.invalid}
                    touched={fieldState.isTouched}
                    dirty={fieldState.isDirty}
                  >
                    <FieldLabel>
                      Apellido <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input {...field} autoComplete="family-name" />
                    <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            </div>

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>
                    Teléfono <span className="text-destructive">*</span>
                  </FieldLabel>
                  <PhoneInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    onChange={(value) => field.onChange(value ?? '')}
                  />
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>Correo</FieldLabel>
                  <Input {...field} type="email" autoComplete="email" />
                  <FieldDescription>
                    Opcional. Necesario si se le crea una cuenta para iniciar sesión.
                  </FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              name="notes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched}
                  dirty={fieldState.isDirty}
                >
                  <FieldLabel>Notas</FieldLabel>
                  <Textarea {...field} rows={3} className="max-h-40" />
                  <FieldDescription>Visible para todos los miembros.</FieldDescription>
                  <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            {form.formState.errors.root && (
              <Alert variant="error">
                <CircleAlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DrawerPanel>

        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
            Cancelar
          </DrawerClose>
          <Button type="submit" form={FORM_ID} disabled={mutation.isPending} loading={mutation.isPending}>
            Crear
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}

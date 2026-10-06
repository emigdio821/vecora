import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle } from '@tabler/icons-react'
import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query'
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
import { type UpdateResidentInput, updateResidentSchema } from '@/lib/validations/residents'
import { m } from '@/paraglide/messages'
import { updateResident } from '@/server-actions/residents'
import { RESIDENTS_QUERY_KEY, type ResidentQueryData } from '@/tanstack-queries/residents'
import { ResidentHouses } from './resident-houses'

const FORM_ID = 'edit-resident-form'

interface EditResidentDrawerProps extends React.ComponentProps<typeof Drawer> {
  resident: ResidentQueryData
  open: boolean
  onOpenChange: (open: boolean) => void
}

type UpdateResidentMutation = UseMutationResult<void, Error, UpdateResidentInput>

export function EditResidentDrawer({ resident, open, onOpenChange, ...props }: EditResidentDrawerProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (values: UpdateResidentInput) => {
      const result = await updateResident(resident.id, values)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: (_data, values) => {
      void queryClient.invalidateQueries({ queryKey: [RESIDENTS_QUERY_KEY] })
      toastManager.add({
        type: 'success',
        title: m.residential_resident_updated(),
        description: m.residential_resident_updated_description({
          name: `${values.first_name} ${values.last_name}`,
        }),
      })
      onOpenChange(false)
    },
  })

  const handleOpenChange: DrawerPrimitive.Root.Props['onOpenChange'] = (nextOpen, eventDetails) => {
    if (!nextOpen && mutation.isPending) {
      eventDetails.cancel()
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Drawer position="right" open={open} onOpenChange={handleOpenChange} {...props}>
      <DrawerPopup variant="inset">
        <DrawerHeader>
          <DrawerTitle>{m.residential_edit_resident()}</DrawerTitle>
          <DrawerDescription>
            {resident.first_name} {resident.last_name}
          </DrawerDescription>
        </DrawerHeader>

        {/* Mounted only while the drawer is open, so the form always starts
            from the current resident and a refetch mid-edit can't reset it. */}
        <EditResidentForm resident={resident} mutation={mutation} />
      </DrawerPopup>
    </Drawer>
  )
}

function toFormValues(resident: ResidentQueryData): UpdateResidentInput {
  return {
    first_name: resident.first_name,
    last_name: resident.last_name,
    phone: resident.phone,
    email: resident.email ?? '',
    notes: resident.notes ?? '',
  }
}

function EditResidentForm({
  resident,
  mutation,
}: {
  resident: ResidentQueryData
  mutation: UpdateResidentMutation
}) {
  const form = useForm<UpdateResidentInput>({
    resolver: zodResolver(updateResidentSchema),
    defaultValues: toFormValues(resident),
  })

  return (
    <>
      <DrawerPanel className="grid gap-6">
        <Form
          id={FORM_ID}
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate(values, {
              // Per-call callback so the error lands in this form instance.
              onError: (error) => form.setError('root', { message: error.message }),
            }),
          )}
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
                    {m.residential_field_first_name()} <span className="text-destructive">*</span>
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
                    {m.residential_field_last_name()} <span className="text-destructive">*</span>
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
                  {m.common_field_phone()} <span className="text-destructive">*</span>
                </FieldLabel>
                <PhoneInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  onChange={(value) => {
                    field.onChange(value ?? '')
                  }}
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
                <FieldLabel>{m.common_field_email()}</FieldLabel>
                <Input {...field} inputMode="email" autoComplete="email" />
                <FieldDescription>{m.residential_email_hint()}</FieldDescription>
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
                <FieldLabel>{m.common_field_notes()}</FieldLabel>
                <Textarea {...field} rows={3} className="max-h-40" />
                <FieldDescription>{m.residential_notes_hint()}</FieldDescription>
                <FieldError match={!!fieldState.error}>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {form.formState.errors.root && (
            <Alert variant="error">
              <IconAlertCircle />
              <AlertTitle>{m.common_error()}</AlertTitle>
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}
        </Form>

        {/* Links save on their own (assign/unassign), independent of the form's Guardar. */}
        <ResidentHouses resident={resident} disabled={mutation.isPending} />
      </DrawerPanel>

      <DrawerFooter>
        <DrawerClose render={<Button variant="ghost" />} disabled={mutation.isPending}>
          {m.common_action_cancel()}
        </DrawerClose>
        <Button
          type="submit"
          form={FORM_ID}
          disabled={mutation.isPending || !form.formState.isDirty}
          loading={mutation.isPending}
        >
          {m.common_action_save()}
        </Button>
      </DrawerFooter>
    </>
  )
}
